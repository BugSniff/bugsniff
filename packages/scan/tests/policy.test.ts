import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { observeStore, type Scan } from "../scan";
import { startFixtureStore, type FixtureStore } from "./fixture-store";

/**
 * Procurar a política, em vez de esperar que ela se apresente.
 *
 * Uma loja que publica a política e uma loja onde não conseguimos achar a
 * política saem idênticas de uma busca preguiçosa, e só uma das duas merece o
 * que o relatório vai dizer. Cada caso aqui é uma loja real que a busca antiga
 * dava como "not-found" tendo a política publicada — e o último é o preço
 * disso: procurar mais não pode virar achar qualquer coisa.
 */
let store: FixtureStore;
const scans: Record<string, Scan> = {};

beforeAll(async () => {
  store = await startFixtureStore();

  const shops = [
    "policyInBanner",
    "onlyPrivacidade",
    "onlyTrocas",
    "unlinked",
    "catchAll",
    "cookiesFirst",
    "policyRefused",
  ] as const;

  const results = await Promise.all(
    shops.map((name) => observeStore(store[name]))
  );
  shops.forEach((name, index) => (scans[name] = results[index]));
}, 180_000);

afterAll(() => store?.close());

/** O texto lido, ou vazio se a leitura não achou política nenhuma. */
const text = (scan: Scan) =>
  scan.ok && scan.policy.state === "found" ? scan.policy.text : "";

describe("a política que só existe dentro do banner", () => {
  test("é lida, mesmo com o banner já aceito e fora da página", () => {
    expect(scans.policyInBanner).toMatchObject({
      ok: true,
      consentBanner: "accepted",
      policy: { state: "found" },
    });
    expect(text(scans.policyInBanner)).toContain("dados pessoais");
  });
});

describe("a política atrás de um link que não se chama política", () => {
  test('lê a política quando o único link diz "Privacidade"', () => {
    expect(scans.onlyPrivacidade).toMatchObject({
      ok: true,
      policy: { state: "found" },
    });
    expect(text(scans.onlyPrivacidade)).toContain("dados pessoais");
  });

  // A outra metade da regra, e a que a mantém honesta: uma página pode ser
  // longa, estar no rodapé, e não ser a política de privacidade.
  test("não confunde a política de trocas com a de privacidade", () => {
    expect(scans.onlyTrocas).toMatchObject({
      ok: true,
      policy: { state: "not-found" },
    });
  });
});

describe("a política que ninguém linkou", () => {
  test("é encontrada no endereço onde as lojas a publicam", () => {
    expect(scans.unlinked).toMatchObject({
      ok: true,
      policy: { state: "found" },
    });
    expect(text(scans.unlinked)).toContain("dados pessoais");
  });
});

describe("a loja cujo link de privacidade abre a página de cookies", () => {
  // Medido na sephora.com.br. A leitura fraca é guardada, não devolvida, então
  // a busca continua e chega na política de verdade — que estava publicada o
  // tempo todo, a um endereço de distância.
  test("lê a política, não a página de cookies", () => {
    expect(scans.cookiesFirst).toMatchObject({
      ok: true,
      policy: {
        state: "found",
        url: expect.stringContaining("/politica-de-privacidade"),
      },
    });
    expect(text(scans.cookiesFirst)).toContain(
      "Utilizamos cookies de terceiros"
    );
  });
});

describe("a loja que responde 200 para qualquer endereço", () => {
  // O preço de procurar por endereço. Peça a política a uma loja de página
  // única e ela devolve a própria loja: longa, falando de dados pessoais
  // porque o aviso de cookies fala, e pronta para ser arquivada como política.
  test("não tem a própria home arquivada como política", () => {
    expect(scans.catchAll).toMatchObject({
      ok: true,
      policy: { state: "not-found" },
    });
  });
});

/** O que a busca registrou, para a leitura poder ser conferida. */
const survey = (scan: Scan) => (scan.ok ? scan.policy.survey : null);

const outcomeOf = (scan: Scan, matching: RegExp) =>
  survey(scan)?.candidates.find((c) => matching.test(c.url))?.outcome;

describe("a loja cuja política está no lugar certo e recusa o navegador", () => {
  test("não vira loja sem política: vira política que não abriu", () => {
    // Medido no smiles.com.br. O link estava no rodapé, escrito por extenso, e
    // o servidor do outro lado respondeu 403.
    expect(scans.policyRefused).toMatchObject({
      ok: true,
      policy: { state: "unreadable" },
    });
  });

  test("e a busca registra que foi esse link que recusou", () => {
    expect(outcomeOf(scans.policyRefused, /politica-de-privacidade/)).toBe(
      "refused"
    );
  });
});

describe("o que a busca registra sobre si mesma", () => {
  test("conta os links da página, achando ou não a política", () => {
    // Também quando encontrou: os links que ela passou por cima fazem parte do
    // que ela fez, e busca que só aparece quando falha é busca que ninguém
    // consegue calibrar.
    expect(survey(scans.onlyPrivacidade)?.seen).toBeGreaterThan(0);
    expect(outcomeOf(scans.onlyPrivacidade, /privacidade/)).toBe("policy");
  });

  test("mostra a página de cookies como caminho, nunca como a política", () => {
    // A política de cookies não é a política de privacidade, e continua não
    // sendo. O que mudou é que agora ela é seguida como um caminho até a
    // política, que é o que ela costuma ser.
    expect(outcomeOf(scans.cookiesFirst, /cookies/)).toBe("hub");
    expect(scans.cookiesFirst).toMatchObject({
      ok: true,
      policy: {
        state: "found",
        url: expect.stringContaining("politica-de-privacidade"),
      },
    });
  });

  test("não inventa candidato numa loja que não linka nada", () => {
    expect(survey(scans.unlinked)?.candidates).toEqual([]);
  });
});
