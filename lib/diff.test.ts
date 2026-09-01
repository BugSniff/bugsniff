import { describe, expect, test } from "vitest";
import { changedParts, diffCount, diffLines } from "./diff";

const kinds = (before: string, after: string) =>
  diffLines(before, after).map(({ kind, text }) => `${kind[0]} ${text}`);

describe("o que mudou entre duas versões", () => {
  test("texto igual não tem diferença nenhuma", () => {
    expect(diffCount(diffLines("a\nb\nc", "a\nb\nc"))).toEqual({
      added: 0,
      removed: 0,
    });
  });

  test("linha trocada aparece como uma saindo e uma entrando", () => {
    expect(kinds("a\nb\nc", "a\nB\nc")).toEqual(["k a", "r b", "a B", "k c"]);
  });

  test("linha nova no meio não desalinha o resto", () => {
    // O erro que um diff ingênuo comete: a partir da inserção, tudo vira
    // diferente, e o leitor perde a mudança de verdade num muro vermelho.
    expect(kinds("a\nb", "a\nnova\nb")).toEqual(["k a", "a nova", "k b"]);
  });

  test("conta o que entrou e o que saiu", () => {
    expect(diffCount(diffLines("a\nb\nc", "a\nx\ny\nc"))).toEqual({
      added: 2,
      removed: 1,
    });
  });
});

describe("mostrar só o que mudou", () => {
  const antes = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].join("\n");

  test("recorta em volta da mudança", () => {
    const partes = changedParts(diffLines(antes, antes.replace("5", "cinco")));

    expect(partes).toHaveLength(1);
    expect(partes[0].map((l) => l.text)).toEqual([
      "3",
      "4",
      "5",
      "cinco",
      "6",
      "7",
    ]);
  });

  test("junta duas mudanças vizinhas num bloco só", () => {
    const depois = antes.replace("4", "quatro").replace("5", "cinco");
    expect(changedParts(diffLines(antes, depois))).toHaveLength(1);
  });

  test("separa duas mudanças distantes", () => {
    const depois = antes.replace("1", "um").replace("9", "nove");
    expect(changedParts(diffLines(antes, depois))).toHaveLength(2);
  });

  test("não recorta nada quando nada mudou", () => {
    expect(changedParts(diffLines(antes, antes))).toEqual([]);
  });
});
