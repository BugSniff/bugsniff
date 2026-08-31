import { describe, expect, it } from "vitest";
import { deriveFrom, observe, type Observation } from "../index";
import { NORMS } from "../norms";

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.net$",
  },
  { name: "Google Analytics", cookie_pattern: "^_ga", host_pattern: null },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
];

const reading = (over: Partial<Parameters<typeof observe>[0]> = {}) => ({
  cookies: [],
  requests: [],
  policy: { text: null, url: null },
  ...over,
});

describe("observe", () => {
  it("reports a tracker that was already there before the visitor answered", () => {
    const found = observe(
      reading({
        cookies: [{ name: "_fbp", phase: "pre-consent" }],
        requests: [{ host: "connect.facebook.net", phase: "pre-consent" }],
      }),
      TRACKERS
    );

    expect(found).toEqual([
      {
        kind: "tracker-before-consent",
        tracker: "Meta Pixel",
        cookies: ["_fbp"],
        hosts: ["connect.facebook.net"],
      },
    ]);
  });

  it("says nothing about a tracker that only fired after consent", () => {
    const found = observe(
      reading({ cookies: [{ name: "_ga", phase: "post-consent" }] }),
      TRACKERS
    );

    expect(found).toEqual([]);
  });

  it("leaves the store's own cookies alone", () => {
    const found = observe(
      reading({ cookies: [{ name: "carrinho", phase: "pre-consent" }] }),
      TRACKERS
    );

    expect(found).toEqual([]);
  });

  // The acceptance criterion this package exists for: present in the exam,
  // absent from the policy.
  it("reports a tracker the published policy does not name", () => {
    const found = observe(
      reading({
        cookies: [{ name: "_hj", phase: "post-consent" }],
        policy: {
          text: "Utilizamos cookies do Google para medir audiência.",
          url: "https://loja.com.br/privacidade",
        },
      }),
      TRACKERS
    );

    expect(found).toEqual([
      {
        kind: "tracker-undisclosed",
        tracker: "Hotjar",
        policyUrl: "https://loja.com.br/privacidade",
      },
    ]);
  });

  it("counts a tracker the policy names, in the vendor's own word, as disclosed", () => {
    const found = observe(
      reading({
        cookies: [{ name: "_hj", phase: "post-consent" }],
        policy: {
          text: "Usamos Hotjar para entender a navegação.",
          url: "https://loja.com.br/privacidade",
        },
      }),
      TRACKERS
    );

    expect(found).toEqual([]);
  });

  it("is not fooled by the vendor's name inside another word", () => {
    const found = observe(
      reading({
        cookies: [{ name: "_fbp", phase: "post-consent" }],
        policy: {
          text: "Tratamos metadados de navegação com finalidade estatística.",
          url: "https://loja.com.br/privacidade",
        },
      }),
      TRACKERS
    );

    expect(found).toEqual([
      {
        kind: "tracker-undisclosed",
        tracker: "Meta Pixel",
        policyUrl: "https://loja.com.br/privacidade",
      },
    ]);
  });

  // A policy we never opened is not a policy that stays silent. Reporting one
  // as the other would put a false fact in somebody's report.
  it("says nothing about disclosure when the policy was not read", () => {
    const found = observe(
      reading({ cookies: [{ name: "_hj", phase: "post-consent" }] }),
      TRACKERS
    );

    expect(found).toEqual([]);
  });
});

const OBSERVATION: Observation = {
  kind: "tracker-before-consent",
  tracker: "Meta Pixel",
  cookies: ["_fbp"],
  hosts: [],
};

const excerptOf = (id: string) =>
  NORMS.find((norm) => norm.id === id)!.text.slice(0, 80);

describe("deriveFrom", () => {
  it("publishes a finding whose excerpt is really in the norm", async () => {
    const { approved, rejected } = await deriveFrom(
      [OBSERVATION],
      async () => ({
        observedFact:
          "A loja gravou o cookie _fbp antes de qualquer interação.",
        normId: "lgpd-art-7-i",
        normExcerpt: excerptOf("lgpd-art-7-i"),
      })
    );

    expect(rejected).toEqual([]);
    expect(approved).toHaveLength(1);
    // The citation is the table's, never the model's.
    expect(approved[0].normCitation).toBe(
      "Lei nº 13.709/2018 (LGPD), art. 7º, I"
    );
    expect(approved[0].evidence).toContain("_fbp");
  });

  it("does not publish a finding that concludes", async () => {
    const { approved, rejected } = await deriveFrom(
      [OBSERVATION],
      async () => ({
        observedFact: "A loja está em desacordo com a lei.",
        normId: "lgpd-art-7-i",
        normExcerpt: excerptOf("lgpd-art-7-i"),
      })
    );

    expect(approved).toEqual([]);
    expect(rejected[0].reason.kind).toBe("forbidden-language");
  });

  it("does not publish a passage the norm does not contain", async () => {
    const { approved, rejected } = await deriveFrom(
      [OBSERVATION],
      async () => ({
        observedFact:
          "A loja gravou o cookie _fbp antes de qualquer interação.",
        normId: "lgpd-art-7-i",
        normExcerpt: "O consentimento deve ser colhido por banner.",
      })
    );

    expect(approved).toEqual([]);
    expect(rejected[0].reason.kind).toBe("excerpt-not-in-source");
  });

  it("does not publish a citation of a norm we do not hold", async () => {
    const { approved, rejected } = await deriveFrom(
      [OBSERVATION],
      async () => ({
        observedFact:
          "A loja gravou o cookie _fbp antes de qualquer interação.",
        normId: "lgpd-art-42",
        normExcerpt: "qualquer coisa",
      })
    );

    expect(approved).toEqual([]);
    expect(rejected[0].reason.kind).toBe("unknown-norm");
  });

  it("drops an observation the model could not write about, and keeps the rest", async () => {
    const { approved } = await deriveFrom(
      [OBSERVATION, OBSERVATION],
      async (observation) =>
        observation === OBSERVATION
          ? {
              observedFact: "A loja gravou o cookie _fbp antes da interação.",
              normId: "lgpd-art-8",
              normExcerpt: excerptOf("lgpd-art-8"),
            }
          : null
    );

    expect(approved).toHaveLength(2);
  });
});
