import { describe, expect, test } from "vitest";
import { validateFindings, type Finding, type NormSources } from "../index";

const ANPD_GUIDE =
  "Recomenda-se que os cookies baseados no consentimento estejam " +
  "desativados por padrão. O uso de legítimo interesse dificilmente será a " +
  "hipótese legal mais apropriada para cookies de publicidade de terceiros.";

const SOURCES: NormSources = new Map([["anpd-cookies", ANPD_GUIDE]]);

const soundFinding: Finding = {
  observedFact:
    "O cookie _fbp (Meta Pixel) foi gravado antes de qualquer interação com o banner.",
  evidence: "Estado pré-consentimento: _fbp presente em .loja.com.br.",
  normId: "anpd-cookies",
  normCitation: "Guia Orientativo de Cookies da ANPD",
  normExcerpt:
    "os cookies baseados no consentimento estejam desativados por padrão",
};

const validate = (f: Partial<Finding>) =>
  validateFindings([{ ...soundFinding, ...f }], SOURCES);

describe("a finding that states a fact and cites a real excerpt", () => {
  test("is approved", () => {
    const { approved, rejected } = validateFindings([soundFinding], SOURCES);
    expect(approved).toEqual([soundFinding]);
    expect(rejected).toEqual([]);
  });

  // Regression: the law is typeset, and a passage copied out of it comes back
  // with the typesetting. The words were identical and the finding was rejected.
  test("is approved when the excerpt differs only in typography", () => {
    const { approved, rejected } = validateFindings(
      [
        {
          ...soundFinding,
          normId: "typografia",
          normExcerpt:
            "observar a boa\u2011f\u00e9\u00a0e os\u200b seguintes \u201cprinc\u00edpios\u201d",
        },
      ],
      new Map([
        [
          "typografia",
          'Dever\u00e3o observar a boa-f\u00e9 e os seguintes "princ\u00edpios": ...',
        ],
      ])
    );

    expect(rejected).toEqual([]);
    expect(approved).toHaveLength(1);
  });

  test("is approved even though the quoted excerpt carries legal wording", () => {
    // The excerpt is verbatim law and may contain the very words the product
    // may not write. Scanning it would reject every correct finding.
    const source = "Constitui infração sujeita a multa a ausência de aviso.";
    const { approved } = validateFindings(
      [
        {
          ...soundFinding,
          normId: "lgpd-52",
          normExcerpt: "Constitui infração sujeita a multa",
        },
      ],
      new Map([["lgpd-52", source]])
    );
    expect(approved).toHaveLength(1);
  });
});

describe("forbidden language", () => {
  test.each([
    ["irregular", "Sua loja está irregular."],
    ["multa", "Isso pode gerar multa."],
    ["você deve", "Você deve corrigir a política."],
    ["obrigatório", "É obrigatório bloquear o script."],
  ])("rejects %s in the observed fact", (term, observedFact) => {
    const { approved, rejected } = validate({ observedFact });
    expect(approved).toEqual([]);
    expect(rejected[0].reason).toEqual({
      kind: "forbidden-language",
      terms: [term],
    });
  });

  test("matches regardless of accent and case", () => {
    const { rejected } = validate({
      evidence: "Houve VIOLACAO do consentimento.",
    });
    expect(rejected[0].reason).toMatchObject({ kind: "forbidden-language" });
  });

  test("catches the term inside a longer word", () => {
    const { rejected } = validate({ evidence: "Constatamos irregularidade." });
    expect(rejected[0].reason).toMatchObject({ kind: "forbidden-language" });
  });

  test("reports every distinct term found, without duplicates", () => {
    const { rejected } = validate({
      observedFact: "Loja irregular, irregular mesmo, sujeita a multa.",
    });
    expect(rejected[0].reason).toEqual({
      kind: "forbidden-language",
      terms: ["irregular", "multa"],
    });
  });

  test("scans the citation too, since the product authors it", () => {
    const { rejected } = validate({
      normCitation: "Norma que torna isso ilegal",
    });
    expect(rejected[0].reason).toMatchObject({ kind: "forbidden-language" });
  });
});

describe("citation must be traceable to its source", () => {
  test("rejects an excerpt that does not occur in the source", () => {
    const { approved, rejected } = validate({
      normExcerpt: "o consentimento deve ser colhido por escrito e com firma",
    });
    expect(approved).toEqual([]);
    expect(rejected[0].reason).toEqual({
      kind: "excerpt-not-in-source",
      normId: "anpd-cookies",
    });
  });

  test("rejects a norm id with no source provided", () => {
    const { rejected } = validate({ normId: "norma-inventada" });
    expect(rejected[0].reason).toEqual({
      kind: "unknown-norm",
      normId: "norma-inventada",
    });
  });

  test("tolerates whitespace and case differences in the excerpt", () => {
    const { approved } = validate({
      normExcerpt:
        "Os Cookies   Baseados No Consentimento\nEstejam Desativados",
    });
    expect(approved).toHaveLength(1);
  });
});

describe("malformed findings", () => {
  test.each([
    "observedFact",
    "evidence",
    "normId",
    "normCitation",
    "normExcerpt",
  ])("rejects a blank %s", (field) => {
    const { rejected } = validate({ [field]: "   " });
    expect(rejected[0].reason).toEqual({ kind: "empty-field", field });
  });
});

test("partitions a mixed batch, keeping only what is publishable", () => {
  const { approved, rejected } = validateFindings(
    [soundFinding, { ...soundFinding, observedFact: "A loja está irregular." }],
    SOURCES
  );
  expect(approved).toHaveLength(1);
  expect(rejected).toHaveLength(1);
});
