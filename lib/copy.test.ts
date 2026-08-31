import { describe, expect, test } from "vitest";
import {
  refusalHeading,
  scanRefusal,
  sendFailure,
  sendMessage,
  showAddress,
} from "./copy";

/**
 * One rule, tested from every direction it can be broken: nothing a stranger
 * writes into the URL of these pages ever reaches the screen.
 *
 * It was broken once already — the refusal arrived as a sentence and was
 * rendered as the heading of the card, so a crafted link could put any words
 * at the top of our login screen in 20px semibold.
 */
describe("what the public funnel may say", () => {
  test("names the failures it distinguishes", () => {
    expect(sendFailure("over_email_send_rate_limit")).toBe("muitos");
    expect(sendMessage("muitos")).toContain("Pedidos demais");
    expect(refusalHeading("expirado")).toBe(
      "Este link expirou ou já foi usado"
    );
  });

  test("falls back to our own words for anything it does not know", () => {
    for (const crafted of [
      "Sua conta foi suspensa. Ligue para 0800-123-4567",
      "<script>alert(1)</script>",
      "",
      "falhou",
    ]) {
      expect(sendMessage(crafted)).toBe(SAFE_SEND);
      expect(refusalHeading(crafted)).toBe(SAFE_REFUSAL);
      expect(scanRefusal(crafted)).toBe(SAFE_SCAN);
    }
  });

  test("only ever puts one of our own codes in the URL", () => {
    expect(sendFailure("Sua conta foi suspensa")).toBe("falhou");
    expect(sendFailure("")).toBe("falhou");
  });

  describe("the address on the sent screen", () => {
    test("is shown when it is an address", () => {
      expect(showAddress("marina@agenciacaravela.com.br")).toBe(true);
    });

    test("is not shown when it is a sentence", () => {
      for (const crafted of [
        "Ligue para 0800-123-4567 para liberar seu acesso",
        "marina@agencia.com.br e confirme sua senha",
        "não é um e-mail",
        "",
        `${"a".repeat(250)}@b.com`,
      ]) {
        expect(showAddress(crafted)).toBe(false);
      }
    });
  });
});

const SAFE_SEND = "Não conseguimos enviar o link agora. Tente de novo.";
const SAFE_REFUSAL = "Este link não vale mais";
const SAFE_SCAN = "Não conseguimos começar o exame. Tente de novo.";
