import { describe, expect, test } from "vitest";
import { scoreOf, type Dimension } from "./score";

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.net$",
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
  { name: "Criteo", cookie_pattern: "^cto_", host_pattern: null },
];

/** A policy that covers everything, so a test can take one thing away at a time. */
const COMPLETE = `
Política de privacidade da Doceria Exemplo Ltda., inscrita no CNPJ 12.345.678/0001-90.
Usamos Meta, Hotjar e Criteo para medir a navegação.
Você pode revogar o consentimento a qualquer momento.
Fale conosco em privacidade@exemplo.com.br.
Você tem os direitos do titular previstos no art. 18, incluindo portabilidade e
confirmação da existência de tratamento.
Nosso encarregado responde no mesmo endereço.
`;

const reading = (over = {}) => ({
  consent_banner: "accepted" as const,
  policy_state: "found",
  policy_text: COMPLETE,
  cookies: [] as { name: string; phase?: "pre-consent" | "post-consent" }[],
  requests: [] as { host: string; phase?: "pre-consent" | "post-consent" }[],
  ...over,
});

const of = (over = {}) => scoreOf(reading(over), TRACKERS);
const dim = (over: object, key: string): Dimension =>
  of(over).dimensions.find((d) => d.key === key)!;

describe("scoreOf", () => {
  test("the weights add up to a hundred", () => {
    const total = of().dimensions.reduce((sum, d) => sum + d.weight, 0);
    expect(total).toBe(100);
  });

  test("gives full marks to a store that waited, asked and declared", () => {
    const score = of({
      cookies: [
        { name: "_fbp", phase: "post-consent" },
        { name: "_hjSession", phase: "post-consent" },
      ],
    });

    expect(score.value).toBe(100);
    expect(score.measured).toBe(100);
  });

  test("takes off the consent share that fired early", () => {
    const cookies = [
      { name: "_fbp", phase: "pre-consent" as const },
      { name: "_hjSession", phase: "post-consent" as const },
    ];

    expect(dim({ cookies }, "consentimento").earned).toBe(15);
    expect(of({ cookies }).value).toBeLessThan(100);
  });

  test("counts what the policy names and what it does not", () => {
    const cookies = [
      { name: "_fbp", phase: "pre-consent" as const },
      { name: "cto_bundle", phase: "pre-consent" as const },
    ];

    expect(
      dim({ cookies, policy_text: "Usamos Meta para medir." }, "nomeia").detail
    ).toBe("A política nomeia 1 dos 2 rastreadores observados.");
  });
});

describe("o que a política declara", () => {
  const without = (line: RegExp) => COMPLETE.replace(line, "");

  test("finds each point when the policy covers it", () => {
    for (const key of [
      "revogacao",
      "controlador",
      "contato",
      "direitos",
      "encarregado",
    ]) {
      expect(dim({}, key).earned, key).toBe(dim({}, key).weight);
    }
  });

  test("misses the point when the policy does not make it", () => {
    expect(
      dim({ policy_text: without(/Você pode revogar.*\n/) }, "revogacao").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/.*CNPJ.*\n/) }, "controlador").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/Fale conosco.*\n/) }, "contato").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/Nosso encarregado.*\n/) }, "encarregado")
        .earned
    ).toBe(0);
  });

  // One right named in passing is a retention paragraph; two is a policy
  // actually listing them.
  test("wants more than one word to call the rights listed", () => {
    expect(
      dim({ policy_text: "Falamos de eliminação dos dados." }, "direitos")
        .earned
    ).toBe(0);
    expect(
      dim(
        {
          policy_text:
            "Você tem portabilidade e anonimização, nos termos do art. 18.",
        },
        "direitos"
      ).earned
    ).toBe(7);
  });
});

/**
 * The half that keeps the number from lying: a reading that could not measure
 * something scores nothing for it in *either* direction. Charging the store
 * for our own browser's failure is how a score turns into an accusation.
 */
describe("o que a leitura não conseguiu medir", () => {
  const noPolicy = { policy_state: "not-found", policy_text: null };

  test("leaves every policy point out when the policy was not reached", () => {
    const score = of(noPolicy);

    for (const d of score.dimensions.filter((d) => d.group === "declara")) {
      expect(d.earned, d.key).toBeNull();
    }
    // Only what the browser watched: consent and banner.
    expect(score.measured).toBe(45);
    // And therefore no number. A store that fired nothing would otherwise get
    // a confident 100 built on 45% of the criteria.
    expect(score.value).toBeNull();
  });

  test("does not charge the store for a banner we could not answer", () => {
    expect(dim({ consent_banner: "unrecognised" }, "banner").earned).toBeNull();
    expect(of({ consent_banner: "unrecognised" }).measured).toBe(85);
  });

  // A banner our browser looked for and did not find is a different fact from
  // one it could not answer, and this is the one that costs points (#32).
  test("does charge for a banner that is not there at all", () => {
    expect(dim({ consent_banner: "not-found" }, "banner").earned).toBe(0);
    expect(of({ consent_banner: "not-found" }).measured).toBe(100);
  });

  test("says how little it could measure when almost nothing was readable", () => {
    expect(of({ ...noPolicy, consent_banner: "unrecognised" }).measured).toBe(
      30
    );
  });
});
