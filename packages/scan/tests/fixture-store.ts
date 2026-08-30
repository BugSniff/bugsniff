import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A store whose behaviour we know, so the scan can be checked against it.
 *
 * A real store is not a test: its trackers change, its banner vendor changes,
 * and a scan that breaks looks exactly like a store that changed. This one
 * always does the same three things — fires a tracker before anything is
 * asked, offers a refusal dressed as an accept, and fires a second tracker
 * only after the real accept.
 *
 * Served on loopback, which is why the test drives `observeStore` rather than
 * `runScan`: the URL guard refuses private addresses, and rightly so.
 */

/** Fires on every load, before anything is asked. */
const TRACKER_BEFORE = "fixture_analytics";

/** Fires only on a load that already carries consent. */
const TRACKER_AFTER = "fixture_pixel";

const page = (banner: boolean) => `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Loja de teste</title></head>
<body>
<h1>Loja de teste</h1>

<script>
  document.cookie = "${TRACKER_BEFORE}=1; path=/; max-age=3600";
  if (document.cookie.includes("fixture_consent=all")) {
    document.cookie = "${TRACKER_AFTER}=1; path=/; max-age=3600";
  }
</script>

${
  banner
    ? `<div id="banner" hidden>
  <p>Este site usa cookies.</p>
  <!-- The refusal comes first on purpose: it opens with an accepting word, and
       a scan that clicks the first thing that looks like an accept reports a
       store that tracks as a store that does not. -->
  <button onclick="consent('necessary')">Aceitar apenas os necessários</button>
  <button onclick="consent('none')">Rejeitar</button>
  <button onclick="consent('all')">Aceitar todos</button>
</div>

<script>
  function consent(choice) {
    document.cookie = "fixture_consent=" + choice + "; path=/; max-age=3600";
    document.getElementById("banner").hidden = true;
  }
  // A banner arrives with its vendor's script, never with the page.
  setTimeout(function () {
    document.getElementById("banner").hidden = false;
  }, 300);
</script>`
    : ""
}
</body>
</html>
`;

export type FixtureStore = {
  /** The store that shows a banner. */
  withBanner: URL;
  /** The same store, asking nothing. */
  withoutBanner: URL;
  close: () => Promise<void>;
};

export async function startFixtureStore(): Promise<FixtureStore> {
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page(request.url !== "/no-banner"));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${port}`;

  return {
    withBanner: new URL(origin),
    withoutBanner: new URL(`${origin}/no-banner`),
    close: () => {
      // Chromium keeps its connection alive, and `close` waits for every open
      // one — without this the fixture never shuts down and the run hangs.
      server.closeAllConnections();
      return new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    },
  };
}
