import { describe, expect, test } from "vitest";
import { privacyPolicy } from "@/packages/document";
import { scoreOf } from "@/lib/score";
import type { Tracker } from "@/packages/tracker";

/**
 * O documento que geramos passa na nota que nós mesmos damos.
 *
 * O teste que fecha o círculo do produto. As cinco dimensões de texto da
 * pontuação (ADR-0006) são as exigências da LGPD sobre o que uma política
 * precisa dizer — revogação, controlador, contato, direitos, encarregado — e
 * são elas que a auditoria cobra da loja. Gerar um documento que não passa
 * nessas mesmas verificações seria vender a alguém a correção de um problema
 * que continua ali.
 *
 * Ele mora aqui, e não no pacote, porque cruza o gerador com a nota, e a nota é
 * do app.
 */

const TRACKERS: Tracker[] = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "(^|\\.)facebook\\.net$",
  },
  {
    name: "Google Analytics",
    cookie_pattern: "^_ga",
    host_pattern: "(^|\\.)google-analytics\\.com$",
  },
];

const TEXTO = privacyPolicy({
  host: "casadobolo.com.br",
  company: {
    legalName: "Casa do Bolo Comércio de Alimentos Ltda.",
    cnpj: "12.345.678/0001-90",
    address: "Rua das Flores, 100, São Paulo/SP",
    email: "contato@casadobolo.com.br",
    officer: "Maria Souza",
    officerEmail: "dpo@casadobolo.com.br",
  },
  trackers: [
    { name: "Meta Pixel", purpose: "marketing" },
    { name: "Google Analytics", purpose: "analytics" },
  ],
  readAt: new Date("2026-08-17T12:00:00Z"),
  at: new Date("2026-09-01T12:00:00Z"),
});

const NOTA = scoreOf(
  {
    consent_banner: "accepted",
    policy_state: "found",
    policy_text: TEXTO,
    cookies: [{ name: "_fbp", phase: "post-consent" }],
    requests: [{ host: "www.google-analytics.com", phase: "post-consent" }],
  },
  TRACKERS
);

const dimensao = (key: string) => NOTA.dimensions.find((d) => d.key === key);

describe("a política que o produto gera", () => {
  test("declara quem é o controlador", () => {
    expect(dimensao("controlador")?.earned).toBe(6);
  });

  test("dá um canal de contato", () => {
    expect(dimensao("contato")?.earned).toBe(6);
  });

  test("diz como revogar o consentimento", () => {
    expect(dimensao("revogacao")?.earned).toBe(7);
  });

  test("lista os direitos do titular", () => {
    expect(dimensao("direitos")?.earned).toBe(7);
  });

  test("informa o encarregado", () => {
    expect(dimensao("encarregado")?.earned).toBe(4);
  });

  test("nomeia todos os serviços que a leitura observou", () => {
    expect(dimensao("nomeia")?.earned).toBe(15);
  });

  test("e por isso a loja que a publica tira 100", () => {
    // Só quando ela também se comporta: os rastreadores desta leitura
    // dispararam depois do consentimento. Documento bom não conserta loja que
    // dispara antes — e a nota tem de continuar dizendo isso.
    expect(NOTA.value).toBe(100);
  });
});
