import { describe, expect, test } from "vitest";
import { applyView, clientsOf, groupByClient, type AgencyRow } from "./agency";

/**
 * A lista da agência, que é onde o produto para de ser sobre uma loja.
 *
 * O que está testado aqui são as três decisões que uma lista de quarenta linhas
 * toma e uma de cinco não precisa tomar: onde vai a loja sem nota, o que o
 * agrupamento faz com a ordem que a pessoa acabou de escolher, e o que acontece
 * com quem não tem cliente nenhum.
 */

const row = (over: Partial<AgencyRow> = {}): AgencyRow => ({
  id: "a",
  host: "loja.com.br",
  client: null,
  exams: 1,
  findings: 0,
  score: 70,
  beforeConsent: 2,
  readAt: "2026-09-01T12:00:00Z",
  failure: null,
  ...over,
});

const VIEW = { sort: "loja" as const, descending: false };

describe("ordenar", () => {
  /**
   * A linha sobre a qual não sabemos nada não pode ser enterrada no fim de uma
   * lista de quarenta. Uma leitura sem nota é uma medição que não terminou, não
   * uma loja em bom estado — e é a que mais precisa de alguém olhando.
   */
  test("sem nota vem primeiro, nas duas direções", () => {
    const rows = [
      row({ id: "alta", score: 90 }),
      row({ id: "sem", score: null }),
      row({ id: "baixa", score: 20 }),
    ];

    expect(
      applyView(rows, { sort: "pontuacao", descending: false }).map((r) => r.id)
    ).toEqual(["sem", "baixa", "alta"]);

    expect(
      applyView(rows, { sort: "pontuacao", descending: true }).map((r) => r.id)
    ).toEqual(["alta", "baixa", "sem"]);
  });

  test("por achados, do menos para o mais", () => {
    const rows = [
      row({ id: "tres", findings: 3 }),
      row({ id: "zero", findings: 0 }),
    ];

    expect(
      applyView(rows, { sort: "achados", descending: false }).map((r) => r.id)
    ).toEqual(["zero", "tres"]);
  });

  test("loja sem cliente vai para o fim da ordem por cliente", () => {
    const rows = [
      row({ id: "sem", client: null }),
      row({ id: "com", client: "Padaria" }),
    ];

    expect(
      applyView(rows, { sort: "cliente", descending: false }).map((r) => r.id)
    ).toEqual(["com", "sem"]);
  });
});

describe("recortar", () => {
  const rows = [
    row({ id: "sem", score: null, client: "Padaria" }),
    row({ id: "baixa", score: 30, client: "Padaria" }),
    row({ id: "media", score: 60, client: "Bar" }),
    row({ id: "alta", score: 95, client: "Bar" }),
  ];

  test("por faixa de pontuação", () => {
    expect(
      applyView(rows, { ...VIEW, band: "sem-nota" }).map((r) => r.id)
    ).toEqual(["sem"]);

    expect(
      applyView(rows, { ...VIEW, band: "ate-49" }).map((r) => r.id)
    ).toEqual(["baixa"]);

    expect(
      applyView(rows, { ...VIEW, band: "50-79" }).map((r) => r.id)
    ).toEqual(["media"]);

    expect(
      applyView(rows, { ...VIEW, band: "80-100" }).map((r) => r.id)
    ).toEqual(["alta"]);
  });

  test("por cliente", () => {
    expect(
      applyView(rows, { ...VIEW, client: "Bar" })
        .map((r) => r.id)
        .sort()
    ).toEqual(["alta", "media"]);
  });

  test("os dois recortes ao mesmo tempo", () => {
    expect(
      applyView(rows, { ...VIEW, client: "Padaria", band: "ate-49" }).map(
        (r) => r.id
      )
    ).toEqual(["baixa"]);
  });
});

describe("agrupar por cliente", () => {
  /**
   * O agrupamento respeita a ordenação em vez de a substituir. Quem ordenou por
   * pontuação quer ver o pior primeiro, e reordenar os grupos por nome desfaria
   * a pergunta que a pessoa acabou de fazer.
   */
  test("mantém a ordem em que as linhas chegaram", () => {
    const grupos = groupByClient([
      row({ id: "1", client: "Zebra", score: 10 }),
      row({ id: "2", client: "Alfa", score: 20 }),
      row({ id: "3", client: "Zebra", score: 30 }),
    ]);

    expect(grupos.map((g) => g.client)).toEqual(["Zebra", "Alfa"]);
    expect(grupos[0].rows.map((r) => r.id)).toEqual(["1", "3"]);
  });

  test("quem não tem cliente fica num grupo sem nome, no fim", () => {
    const grupos = groupByClient([
      row({ id: "1", client: null }),
      row({ id: "2", client: "Alfa" }),
    ]);

    expect(grupos.map((g) => g.client)).toEqual(["Alfa", null]);
  });

  test("rótulo em branco é o mesmo que não ter cliente", () => {
    const grupos = groupByClient([
      row({ id: "1", client: "" }),
      row({ id: "2", client: null }),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].client).toBeNull();
  });
});

test("os clientes oferecidos no recorte são os que existem, em ordem", () => {
  expect(
    clientsOf([
      row({ client: "Zebra" }),
      row({ client: null }),
      row({ client: "Alfa" }),
      row({ client: "Zebra" }),
    ])
  ).toEqual(["Alfa", "Zebra"]);
});
