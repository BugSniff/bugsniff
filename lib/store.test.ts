import { describe, expect, test } from "vitest";
import { canonicalHost } from "./store";

/**
 * The whole point of the function: everything below is the same shop, so
 * everything below has to produce the same string. A miss here does not throw
 * and does not fail a type check — it quietly gives one shop two histories.
 */
describe("canonicalHost", () => {
  test("reads the same shop out of every way a person writes it", () => {
    const same = [
      "https://loja.com.br/",
      "https://www.loja.com.br/",
      "http://loja.com.br",
      "https://LOJA.COM.BR",
      "https://www.loja.com.br/produtos/bolo-de-fuba?ref=x",
      "https://loja.com.br:443/",
    ].map(canonicalHost);

    expect(new Set(same)).toEqual(new Set(["loja.com.br"]));
  });

  test("keeps different shops apart", () => {
    expect(canonicalHost("https://loja.com.br")).not.toBe(
      canonicalHost("https://outra.com.br")
    );
    // A subdomain is a different address, and may well be a different shop.
    expect(canonicalHost("https://br.loja.com")).toBe("br.loja.com");
    // Only a leading `www.` goes; one in the middle is part of the name.
    expect(canonicalHost("https://www.www.loja.com.br")).toBe(
      "www.loja.com.br"
    );
  });

  test("hands back what it was given when that is not a URL", () => {
    expect(canonicalHost("não é um endereço")).toBe("não é um endereço");
  });
});
