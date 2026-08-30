import { describe, expect, test } from "vitest";
import { registrableDomain, thirdPartyHosts } from "../third-party";

describe("the name a domain is registered under", () => {
  test.each([
    ["loja.com.br", "loja.com.br"],
    ["cdn.loja.com.br", "loja.com.br"],
    ["www.static.loja.com.br", "loja.com.br"],
    ["connect.facebook.net", "facebook.net"],
    ["www.google-analytics.com", "google-analytics.com"],
    ["loja.com", "loja.com"],
    ["shop.co.uk", "shop.co.uk"],
    ["www.shop.co.uk", "shop.co.uk"],
    ["localhost", "localhost"],
  ])("%s is %s", (host, expected) => {
    expect(registrableDomain(host)).toBe(expected);
  });
});

describe("who the store talked to, other than itself", () => {
  const store = new URL("https://www.loja.com.br");

  test("keeps a third party, once, host only", () => {
    expect(
      thirdPartyHosts(
        [
          "https://connect.facebook.net/pt_BR/fbevents.js",
          "https://connect.facebook.net/tr?id=123&ev=PageView",
        ],
        store
      )
    ).toEqual(["connect.facebook.net"]);
  });

  test("never keeps the path or the query", () => {
    // Those carry the visitor's own identifiers. An audit that collects them
    // to prove somebody else collects them has lost its own argument.
    const [host] = thirdPartyHosts(
      ["https://track.example.com/px?uid=abc123&email=someone"],
      store
    );
    expect(host).toBe("track.example.com");
  });

  test("drops the store's own hosts, subdomains included", () => {
    expect(
      thirdPartyHosts(
        [
          "https://www.loja.com.br/checkout",
          "https://cdn.loja.com.br/app.js",
          "https://loja.com.br/favicon.ico",
        ],
        store
      )
    ).toEqual([]);
  });

  test("ignores what never left the browser", () => {
    expect(
      thirdPartyHosts(["data:image/gif;base64,R0lGOD", "blob:nothing"], store)
    ).toEqual([]);
  });
});
