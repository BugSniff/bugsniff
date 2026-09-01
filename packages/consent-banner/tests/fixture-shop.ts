import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A shop that tracks, so the banner can be caught not stopping it.
 *
 * It fires the four shapes a real storefront fires, because the banner blocks
 * each of them by a different patch and a test that only covers one would let
 * the other three regress quietly:
 *
 *   - a cookie written by an inline script
 *   - a pixel by `new Image()`, from an element never inserted in the document
 *   - a tag by a script element appended to the head
 *   - a call by `fetch`, by `XMLHttpRequest` and by `sendBeacon`
 *
 * And two that must keep firing: the essential service, whose blocking would
 * break the shop for nothing, and the third party we cannot name, whose
 * blocking would break it on a guess.
 *
 * Served on loopback so cookies behave like a store's own. The third parties
 * are `.example`, which never resolves — the request leaves, the browser
 * reports it, and not a byte reaches anybody.
 */

/** The two services the banner is expected to hold. */
export const ANALYTICS = { cookie: "fixture_ga", host: "ga-fixture.example" };
export const MARKETING = { cookie: "fixture_px", host: "px-fixture.example" };

/** And the two it is expected to leave alone. */
export const ESSENTIAL = { host: "fonts-fixture.example" };
export const UNNAMED = { host: "unknown-fixture.example" };

/**
 * The store's own scripts, fired on every load.
 *
 * No consent check anywhere in here, on purpose: this is a shop that tracks
 * whoever shows up, which is the shop the audit keeps finding. Everything that
 * stops happening, stops because of the banner and nothing else.
 */
const TRACKING = `<script>
  document.cookie = "${ANALYTICS.cookie}=1; path=/; max-age=3600";
  new Image().src = "http://${ANALYTICS.host}/px.gif";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://${ANALYTICS.host}/collect");
  xhr.send("hit=1");

  if (navigator.sendBeacon) {
    navigator.sendBeacon("http://${ANALYTICS.host}/beacon", "hit=1");
  }

  document.cookie = "${MARKETING.cookie}=1; path=/; max-age=3600";
  var tag = document.createElement("script");
  tag.src = "http://${MARKETING.host}/tag.js";
  document.head.appendChild(tag);

  new Image().src = "http://${ESSENTIAL.host}/font.woff";
  fetch("http://${UNNAMED.host}/quote").catch(function () {});
</script>`;

export type FixtureShop = {
  url: URL;
  close: () => Promise<void>;
};

/**
 * Serves the shop with a banner installed, or with none.
 *
 * The snippet goes where the instructions say to put it — first in the head,
 * ahead of the store's own scripts — because that placement is part of what is
 * being tested. Called with nothing, the same shop serves without a banner,
 * which is the reading the assertions are measured against: if the untouched
 * shop did not fire, the test that says the banner stopped it proves nothing.
 */
export function startFixtureShop(snippet = ""): Promise<FixtureShop> {
  const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Loja de teste</title>
${snippet}
${TRACKING}
</head>
<body><h1>Loja de teste</h1><p>Produtos, carrinho, rodapé.</p></body>
</html>
`;

  const server: Server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
  });

  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: new URL(`http://127.0.0.1:${port}`),
        close: () =>
          new Promise<void>((done, fail) => {
            // Chromium holds its connection open, and `close` waits for every
            // one of them — without this the run hangs instead of ending.
            server.closeAllConnections();
            server.close((error) => (error ? fail(error) : done()));
          }),
      });
    })
  );
}
