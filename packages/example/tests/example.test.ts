import { expect, test } from "vitest";
import { mesmoNome } from "../index";

test("ignora acento e caixa", () => {
  expect(mesmoNome("Política", " POLITICA ")).toBe(true);
});

test("nomes diferentes não casam", () => {
  expect(mesmoNome("Termos", "Política")).toBe(false);
});
