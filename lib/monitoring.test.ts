import { describe, expect, test } from "vitest";
import { alertMessage, appeared } from "./monitoring";
import type { Exam } from "./exams";

/**
 * O aviso que sai sozinho, que é a única coisa neste produto que fala com
 * alguém sem ter sido chamada.
 *
 * Dois riscos, e os dois estão testados aqui. Avisar de menos é perder o
 * pixel que apareceu na sexta-feira, que é a razão de existir do
 * monitoramento. Avisar de mais é o que ensina uma pessoa a arquivar tudo que
 * vem de nós sem ler — e a leitura que ela vai arquivar é a que importava.
 */

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.(net|com)$",
  },
  {
    name: "Google Analytics",
    cookie_pattern: "^_ga",
    host_pattern: "google-analytics\\.com$",
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
];

const exam = (over: Partial<Exam> = {}): Exam => ({
  id: "a",
  url: "https://loja.com.br/",
  status: "done",
  consent_banner: "accepted",
  policy_state: "found",
  cookies: [],
  requests: [],
  created_at: "2026-08-24T12:00:00Z",
  store_id: "s1",
  ...over,
});

describe("o que apareceu entre duas leituras", () => {
  test("um serviço que não estava lá na semana passada", () => {
    const antes = exam({ cookies: [{ name: "_ga", phase: "pre-consent" }] });
    const agora = exam({
      cookies: [
        { name: "_ga", phase: "pre-consent" },
        { name: "_fbp", phase: "pre-consent" },
      ],
    });

    expect(appeared(antes, agora, TRACKERS)).toEqual([
      { name: "Meta Pixel", hosts: [] },
    ]);
  });

  test("nada a dizer quando a leitura encontrou o mesmo de sempre", () => {
    const igual = {
      cookies: [{ name: "_fbp", phase: "pre-consent" as const }],
    };

    expect(appeared(exam(igual), exam(igual), TRACKERS)).toEqual([]);
  });

  test("o endereço para onde os dados foram entra como evidência", () => {
    const agora = exam({
      requests: [
        { host: "connect.facebook.net", phase: "pre-consent" },
        { host: "www.facebook.com", phase: "pre-consent" },
      ],
    });

    expect(appeared(exam(), agora, TRACKERS)).toEqual([
      {
        name: "Meta Pixel",
        hosts: ["connect.facebook.net", "www.facebook.com"],
      },
    ]);
  });

  /**
   * O caso que separa uma mudança da loja de uma mudança do consentimento. Um
   * serviço que só dispara depois de alguém aceitar o banner está fazendo
   * exatamente o que o banner existe para fazer, e avisar sobre isso seria
   * chamar de problema o funcionamento correto.
   */
  test("o que só dispara depois de aceitar não é notícia", () => {
    const agora = exam({
      cookies: [{ name: "_fbp", phase: "post-consent" }],
    });

    expect(appeared(exam(), agora, TRACKERS)).toEqual([]);
  });

  /**
   * Sem isto o primeiro aviso do produto seria um alarme falso: a leitura
   * anterior falhou, `trackersIn` devolve vazio para ela, e a loja inteira
   * "apareceu" de uma vez. Quem chama compara contra a última leitura
   * concluída — e este teste é o que prova que a comparação errada é visível.
   */
  test("comparar contra uma leitura que falhou acusaria a loja inteira", () => {
    const falhou = exam({ status: "failed", cookies: null, requests: null });
    const agora = exam({
      cookies: [
        { name: "_fbp", phase: "pre-consent" },
        { name: "_ga", phase: "pre-consent" },
      ],
    });

    expect(appeared(falhou, agora, TRACKERS)).toHaveLength(2);
  });

  test("terceiro que não sabemos nomear não vira aviso", () => {
    const agora = exam({
      requests: [{ host: "track.desconhecido.com", phase: "pre-consent" }],
    });

    expect(appeared(exam(), agora, TRACKERS)).toEqual([]);
  });
});

describe("a mensagem", () => {
  const mensagem = (appearances: { name: string; hosts: string[] }[]) =>
    alertMessage({
      host: "loja.com.br",
      appearances,
      previousAt: "2026-08-24T12:00:00Z",
      scanUrl: "https://bugsniff.com.br/exame/abc",
    });

  test("nomeia a loja e o serviço no assunto", () => {
    const { subject } = mensagem([{ name: "Meta Pixel", hosts: [] }]);

    expect(subject).toBe(
      "loja.com.br: Meta Pixel passou a disparar antes do consentimento"
    );
  });

  test("conta, quando é mais de um", () => {
    const { subject } = mensagem([
      { name: "Meta Pixel", hosts: [] },
      { name: "Hotjar", hosts: [] },
    ]);

    expect(subject).toContain("2 rastreadores");
  });

  test("diz desde quando não estava lá", () => {
    const { text } = mensagem([{ name: "Meta Pixel", hosts: [] }]);

    expect(text).toContain("24 de agosto de 2026");
  });

  /**
   * A frase que este produto não pode escrever. O aviso relata um fato e cita
   * para onde os dados foram; concluir sobre a situação de quem recebe é
   * competência da advocacia, não nossa (ADR-0001).
   */
  test("não conclui nada sobre a loja", () => {
    const { subject, text } = mensagem([
      { name: "Meta Pixel", hosts: ["connect.facebook.net"] },
    ]);

    expect(`${subject}\n${text}`.toLowerCase()).not.toMatch(
      /irregular|infração|violação|ilegal|não conformidade|multa|risco/
    );
  });

  /**
   * O limite da nossa própria leitura, escrito na mensagem em vez de escondido
   * nela. Sem conexão com a plataforma da loja não temos a lista de apps
   * instalados, e apontar um culpado sem ela seria chute sobre a loja de outra
   * pessoa.
   */
  test("diz que não sabe qual app introduziu, em vez de adivinhar", () => {
    const { text } = mensagem([
      { name: "Meta Pixel", hosts: ["connect.facebook.net"] },
    ]);

    expect(text).toContain("Não sabemos qual app da sua loja introduziu isso");
    expect(text).toContain("connect.facebook.net");
  });

  test("leva o link do exame que encontrou", () => {
    const { text } = mensagem([{ name: "Hotjar", hosts: [] }]);

    expect(text).toContain("https://bugsniff.com.br/exame/abc");
  });
});
