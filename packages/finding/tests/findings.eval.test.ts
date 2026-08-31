import { describe, expect, it } from "vitest";
import { deriveFrom, type Observation } from "../index";

/**
 * The eval: the model, for real, against cases whose right answer we know.
 *
 * Skipped unless `EVAL` is set, which is what `pnpm eval` does. It spends
 * money, it needs a key, and it is not deterministic — three things a suite
 * that gates every commit must not be. What it defends against is the
 * regression a unit test cannot see: a prompt edit, a model swap, or a norm
 * reworded, after which the writing still type-checks and quietly stops being
 * publishable.
 *
 * The score is the share of cases whose finding survives the validator. The
 * floor is what fails the run.
 */

/** Below this, something got worse. Raise it when the writing gets better. */
const FLOOR = 0.9;

/** Enough repetition that one unlucky sample cannot move the score alone. */
const RUNS = 2;

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** The vendor half of a tracker's name — "Google Analytics" is about Google. */
const vendorWords = (name: string) =>
  fold(name)
    .split(/[^a-z0-9]+/)
    .filter(
      (word) =>
        word.length >= 3 &&
        !["ads", "analytics", "manager", "pixel", "tag"].includes(word)
    );

const CASES: readonly Observation[] = [
  {
    kind: "tracker-before-consent",
    tracker: "Meta Pixel",
    cookies: ["_fbp"],
    hosts: ["connect.facebook.net"],
  },
  {
    kind: "tracker-before-consent",
    tracker: "Google Analytics",
    cookies: ["_ga", "_ga_662ZWPHP67"],
    hosts: [],
  },
  {
    kind: "tracker-before-consent",
    tracker: "Google Tag Manager",
    cookies: [],
    hosts: ["www.googletagmanager.com"],
  },
  {
    kind: "tracker-before-consent",
    tracker: "Hotjar",
    cookies: ["_hjSessionUser_123"],
    hosts: [],
  },
  {
    kind: "tracker-before-consent",
    tracker: "TikTok",
    cookies: ["_ttp"],
    hosts: ["analytics.tiktok.com"],
  },
  {
    kind: "tracker-undisclosed",
    tracker: "Criteo",
    policyUrl: "https://loja.exemplo.com.br/politica-de-privacidade",
  },
  {
    kind: "tracker-undisclosed",
    tracker: "Microsoft Clarity",
    policyUrl: "https://loja.exemplo.com.br/privacidade",
  },
  {
    kind: "tracker-undisclosed",
    tracker: "RD Station",
    policyUrl: "https://loja.exemplo.com.br/privacidade",
  },
];

describe.runIf(process.env.EVAL)("findings the model writes", () => {
  it(
    `are publishable in at least ${FLOOR * 100}% of the reference cases`,
    { timeout: 180_000 },
    async () => {
      const runs = await Promise.all(
        Array.from({ length: RUNS }, () => deriveFrom(CASES))
      );

      const approved = runs.flatMap((run) => run.approved);
      const rejected = runs.flatMap((run) => run.rejected);
      const score = approved.length / (CASES.length * RUNS);

      for (const { finding, reason } of rejected) {
        console.error(
          `rejected (${reason.kind})\n  fato: ${finding.observedFact}\n  trecho: ${finding.normExcerpt}`
        );
      }
      console.log(`score ${score.toFixed(2)} — floor ${FLOOR}`);

      expect(score).toBeGreaterThanOrEqual(FLOOR);

      // The fact has to be about the service the observation is about. A
      // finding that reads well and names the wrong tracker passes every other
      // check in this repository — the evidence carries the right name, so the
      // prose is held against it.
      for (const finding of approved) {
        const tracker = CASES.map(({ tracker }) => tracker).find((name) =>
          finding.evidence.includes(name)
        )!;
        const said = fold(finding.observedFact);
        expect(
          vendorWords(tracker).some((word) => said.includes(word)),
          `"${finding.observedFact}" should be about ${tracker}`
        ).toBe(true);
      }
    }
  );
});
