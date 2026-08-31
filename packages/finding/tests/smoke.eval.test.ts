import { expect, test } from "vitest";
import { deriveFindings } from "../index";

/**
 * The whole path, once, against the real model: a reading goes in and findings
 * come out. Skipped unless `EVAL` is set, like the rest of the eval.
 *
 * What the unit tests cannot show is that the three steps agree — that the
 * observations the reader extracts are the ones the writer can write about,
 * and that what it writes survives the validator without anyone stubbing it.
 */

test.runIf(process.env.EVAL)(
  "end to end over a realistic reading",
  { timeout: 60_000 },
  async () => {
    const { approved, rejected } = await deriveFindings(
      {
        cookies: [
          { name: "_fbp", phase: "pre-consent" },
          { name: "carrinho", phase: "pre-consent" },
          { name: "_ga", phase: "post-consent" },
        ],
        requests: [{ host: "connect.facebook.net", phase: "pre-consent" }],
        policy: {
          text: "Utilizamos cookies do Google Analytics para medir a audiência da loja.",
          url: "https://loja.exemplo.com.br/privacidade",
        },
      },
      [
        {
          name: "Meta Pixel",
          cookie_pattern: "^_fbp$",
          host_pattern: "facebook\\.net$",
        },
        {
          name: "Google Analytics",
          cookie_pattern: "^_ga",
          host_pattern: null,
        },
      ]
    );

    expect(rejected).toEqual([]);
    // Meta Pixel fired before consent AND is not named in the policy; Google
    // Analytics fired after and is named. Two findings, both about Meta Pixel.
    expect(approved).toHaveLength(2);
    expect(approved.every((f) => f.observedFact.includes("Meta"))).toBe(true);
  }
);
