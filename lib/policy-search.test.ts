import { describe, expect, test } from "vitest";
import { searchSummary } from "./policy-search";

/**
 * The sentence that turns "não encontramos" into something conferível.
 *
 * The total is what carries the argument, so the plurals matter: a page with
 * one link and a page with two hundred and seventy-five are different claims
 * about how hard we looked.
 */
describe("quão larga foi a busca", () => {
  test("conta os links da página e os que tinham a ver", () => {
    expect(
      searchSummary({
        seen: 275,
        candidates: [
          {
            text: "Política de privacidade",
            url: "https://x/p",
            outcome: "refused",
          },
          {
            text: "Política de Cookies",
            url: "https://x/c",
            outcome: "not-followed",
          },
        ],
      })
    ).toBe("Olhamos os 275 links desta página; 2 tinham a ver com o assunto.");
  });

  test("fala no singular quando é um só", () => {
    expect(
      searchSummary({
        seen: 1,
        candidates: [
          { text: "Privacidade", url: "https://x/p", outcome: "policy" },
        ],
      })
    ).toBe("Olhamos os 1 link desta página; 1 tinha a ver com o assunto.");
  });

  test("diz que olhou mesmo quando nada tinha a ver", () => {
    // O caso em que a frase mais precisa existir: sem ela, "não encontramos a
    // política" e "não procuramos" ficam iguais na tela.
    expect(searchSummary({ seen: 88, candidates: [] })).toBe(
      "Olhamos os 88 links desta página, e nenhum deles falava de política, privacidade ou cookies."
    );
  });

  test("não inventa uma busca numa página sem link nenhum", () => {
    expect(searchSummary({ seen: 0, candidates: [] })).toBe(
      "Não encontramos nenhum link nesta página para seguir."
    );
  });
});
