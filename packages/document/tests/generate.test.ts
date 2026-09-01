import { describe, expect, test } from "vitest";
import { BLANK, companyFrom, missingFrom, type Company } from "../company";
import { generate, privacyPolicy, termsOfUse } from "../index";

/**
 * O documento que a loja publica, escrito a partir do que o exame viu nela.
 *
 * Duas coisas são testadas aqui e as duas são de produto, não de formatação. A
 * seção que nomeia os serviços é a razão de gerar documento em vez de vender
 * modelo — é ela que responde ao art. 9º, V, e é a ausência dela que a
 * auditoria mais encontra. E o campo vazio: gerar documento legal sobre a
 * empresa de outra pessoa dá uma única saída honesta quando falta um dado, que
 * é deixar o buraco à vista.
 */

const EMPRESA: Company = {
  legalName: "Casa do Bolo Comércio de Alimentos Ltda.",
  cnpj: "12.345.678/0001-90",
  address: "Rua das Flores, 100, São Paulo/SP",
  email: "contato@casadobolo.com.br",
  officer: "Maria Souza",
  officerEmail: "dpo@casadobolo.com.br",
};

const ENTRADA = {
  host: "casadobolo.com.br",
  company: EMPRESA,
  trackers: [
    { name: "Meta Pixel", purpose: "marketing" as const },
    { name: "Google Analytics", purpose: "analytics" as const },
    { name: "Google Fonts", purpose: "essential" as const },
  ],
  readAt: new Date("2026-08-17T12:00:00Z"),
  at: new Date("2026-09-01T12:00:00Z"),
};

describe("a seção que nomeia os serviços", () => {
  test("cita cada um pelo nome, e não 'nossos parceiros'", () => {
    const texto = privacyPolicy(ENTRADA);

    expect(texto).toContain("Meta Pixel");
    expect(texto).toContain("Google Analytics");
    expect(texto).toContain("Google Fonts");
  });

  test("separa por finalidade, como o banner separa", () => {
    const texto = privacyPolicy(ENTRADA);

    expect(texto).toMatch(
      /Publicidade e mensuração de campanhas\.\*\* Meta Pixel/
    );
    expect(texto).toMatch(/Medição de audiência\.\*\* Google Analytics/);
    expect(texto).toMatch(
      /Necessários para a loja funcionar\.\*\* Google Fonts/
    );
  });

  test("diz de qual leitura os nomes vieram", () => {
    // O documento afirma coisas sobre a loja. A data é o que permite conferir.
    expect(privacyPolicy(ENTRADA)).toContain("17 de agosto de 2026");
  });

  test("uma loja sem rastreador ganha uma frase, não uma seção vazia", () => {
    const texto = privacyPolicy({ ...ENTRADA, trackers: [] });

    expect(texto).toContain("não observou serviços de terceiros");
    expect(texto).not.toContain("Publicidade e mensuração");
  });
});

describe("o dado da empresa que ninguém preencheu", () => {
  test("vira um buraco à vista, nunca um CNPJ plausível", () => {
    const texto = privacyPolicy({ ...ENTRADA, company: companyFrom({}) });

    expect(texto).toContain(BLANK);
    // O erro que este teste existe para impedir: qualquer coisa com cara de
    // CNPJ num documento legal sobre a empresa de outra pessoa.
    expect(texto).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  });

  test("some quando o dado existe", () => {
    expect(privacyPolicy(ENTRADA)).not.toContain(BLANK);
  });

  test("é listado na ordem em que o formulário pergunta", () => {
    expect(missingFrom(companyFrom({ legalName: "Loja Ltda." }))).toEqual([
      "cnpj",
      "address",
      "email",
      "officer",
      "officerEmail",
    ]);
  });
});

describe("os dois documentos", () => {
  test("usam a mesma empresa, informada uma vez só", () => {
    for (const texto of [privacyPolicy(ENTRADA), termsOfUse(ENTRADA)]) {
      expect(texto).toContain(EMPRESA.legalName);
      expect(texto).toContain(EMPRESA.cnpj);
    }
  });

  test("saem iguais para a mesma entrada", () => {
    // Versão imutável (ADR-0003) só quer dizer algo se a geração for
    // reproduzível: sem isso, "o que mudou entre v2 e v3" mistura o que a loja
    // fez com o que o gerador resolveu escrever diferente.
    expect(generate("privacy_policy", ENTRADA)).toEqual(privacyPolicy(ENTRADA));
    expect(privacyPolicy(ENTRADA)).toEqual(privacyPolicy(ENTRADA));
  });

  test("os termos não inventam o negócio de ninguém", () => {
    // O que a loja vende, cobra e promete são fatos que ninguém aqui sabe.
    const texto = termsOfUse(ENTRADA);

    expect(texto).toContain("Condições específicas desta loja");
    expect(texto).toContain(BLANK);
    // E o que é igual para toda loja brasileira está escrito por extenso.
    expect(texto).toContain("sete dias");
    expect(texto).toContain("artigo 49");
  });
});
