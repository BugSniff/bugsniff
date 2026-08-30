import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Stores whose behaviour we know, so the scan can be checked against them.
 *
 * A real store is not a test: its trackers change, its banner vendor changes,
 * and a scan that breaks looks exactly like a store that changed. These always
 * do the same thing — fire a tracker before anything is asked, and then behave
 * like one of the shapes the scan has to tell apart.
 *
 * Served on loopback, which is why the tests drive `observeStore` rather than
 * `runScan`: the URL guard refuses private addresses, and rightly so.
 */

/** Fires on every load, before anything is asked. */
const TRACKER_BEFORE = "fixture_analytics";

/** Fires only on a load that already carries consent. */
const TRACKER_AFTER = "fixture_pixel";

/**
 * Third parties the page talks to without writing anything.
 *
 * `.example` never resolves, which is the point: the request is made, the
 * browser reports it, and not one byte reaches anybody. It is also the shape
 * the scan was blind to until now — a pixel fired by image writes no cookie.
 */
const THIRD_PARTY_BEFORE = "pixel-before.example";
const THIRD_PARTY_AFTER = "pixel-after.example";

const TRACKERS = `<script>
  document.cookie = "${TRACKER_BEFORE}=1; path=/; max-age=3600";
  new Image().src = "http://${THIRD_PARTY_BEFORE}/px.gif";
  if (document.cookie.includes("fixture_consent=all")) {
    document.cookie = "${TRACKER_AFTER}=1; path=/; max-age=3600";
    new Image().src = "http://${THIRD_PARTY_AFTER}/px.gif";
  }
  function consent(choice) {
    document.cookie = "fixture_consent=" + choice + "; path=/; max-age=3600";
    var banner = document.getElementById("banner");
    if (banner) banner.hidden = true;
  }
  // A banner arrives with its vendor's script, never with the page.
  function showBannerLater() {
    setTimeout(function () {
      document.getElementById("banner").hidden = false;
    }, 300);
  }
</script>`;

/** What every banner shape shares: fixed to an edge, on top, talking cookies. */
const BANNER_STYLE =
  "position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#eee;padding:20px";

const html = (body: string) => `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Loja de teste</title></head>
<body>
<h1>Loja de teste</h1>
${TRACKERS}
${body}
</body>
</html>
`;

/**
 * The ordinary shape: real buttons, and the refusal listed first.
 *
 * "Aceitar apenas os necessários" opens with an accepting word and is the
 * refusal. A scan that clicks the first thing that looks like an accept
 * reports a store that tracks as a store that does not.
 */
const WITH_BANNER = html(`
<div id="banner" hidden style="${BANNER_STYLE}">
  <p>Este site usa cookies.</p>
  <button onclick="consent('necessary')">Aceitar apenas os necessários</button>
  <button onclick="consent('none')">Rejeitar</button>
  <button onclick="consent('all')">Aceitar todos</button>
</div>
<script>showBannerLater()</script>
`);

/**
 * The homemade banner: no vendor, no button element, no role.
 *
 * Div with an onclick and a pointer cursor, which is what a shop owner's
 * developer writes in ten minutes. No fingerprint exists to find it by — only
 * the shape.
 */
const HOMEMADE = html(`
<div id="banner" hidden style="${BANNER_STYLE}">
  <span>Usamos cookies para melhorar sua experiência de navegação.</span>
  <div onclick="consent('all')" style="cursor:pointer">Aceitar</div>
</div>
<script>showBannerLater()</script>
`);

/** The banner in an iframe, which is where TrustArc and some OneTrust put it. */
const IN_IFRAME = html(`
<iframe src="/banner-frame" style="${BANNER_STYLE};border:0;height:120px"></iframe>
`);

const BANNER_FRAME = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="margin:0">
  <p>Este site usa cookies.</p>
  <button id="accept">Aceitar todos</button>
  <script>
    document.getElementById("accept").onclick = function () {
      // Same host as the parent, so the consent lands where the store reads it.
      document.cookie = "fixture_consent=all; path=/; max-age=3600";
      document.body.innerHTML = "<p>Obrigado.</p>";
    };
  </script>
</body>
</html>
`;

/**
 * Consent machinery installed, and nothing the scan can click.
 *
 * This is the case that must never be reported as a store that asks nothing:
 * there is a banner in front of the visitor, and all the scan can honestly say
 * is that it could not answer it.
 */
const UNCLICKABLE = html(`
<script>window.__tcfapi = function () {};</script>
<div id="banner" style="${BANNER_STYLE}">
  <p>Este site usa cookies e trata dados pessoais conforme a LGPD.</p>
</div>
`);

/** A store that asks nothing at all. */
const NO_BANNER = html("");

/**
 * A shop that refuses our browser.
 *
 * Answers 403 with a page of its own — title, body, and a cookie. Read without
 * looking at the status, it is a store with nothing to report, which is the
 * most flattering possible way to be wrong about somebody.
 */
const REFUSED = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Access Denied</title></head>
<body>
<p>You don't have permission to access this server.</p>
<script>document.cookie = "fixture_edge=1; path=/; max-age=3600";</script>
</body>
</html>
`;

/**
 * A footer link that opens with an accepting word.
 *
 * Not fixed, not a banner. It is here because a scan that hunts for an accept
 * across the whole page clicks this one and reports a consent that nobody gave.
 */
const FOOTER_TRAP = `<footer><a href="#" onclick="consent('all')">Aceito os termos de uso</a></footer>`;

const PAGES: Record<string, string> = {
  "/": WITH_BANNER,
  "/homemade": HOMEMADE,
  "/iframe": IN_IFRAME,
  "/banner-frame": BANNER_FRAME,
  "/unclickable": UNCLICKABLE.replace("</body>", `${FOOTER_TRAP}</body>`),
  "/no-banner": NO_BANNER.replace("</body>", `${FOOTER_TRAP}</body>`),
};

/** The paths that answer with something other than a store. */
const REFUSING = "/refused";

export type FixtureStore = {
  /** Real buttons, with the refusal listed before the accept. */
  withBanner: URL;
  /** No vendor, no button element: a div with an onclick. */
  homemade: URL;
  /** The banner lives in an iframe. */
  inIframe: URL;
  /** Consent machinery present, nothing to click, and a footer trap. */
  unclickable: URL;
  /** Asks nothing, and carries the same footer trap. */
  withoutBanner: URL;
  /** Answers 403 with a page that is not the store. */
  refusing: URL;
  close: () => Promise<void>;
};

export async function startFixtureStore(): Promise<FixtureStore> {
  const server = createServer((request, response) => {
    const path = request.url ?? "/";
    const page = PAGES[path];
    const refused = path === REFUSING;

    response.writeHead(refused ? 403 : page ? 200 : 404, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(refused ? REFUSED : (page ?? "<p>not here</p>"));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${port}`;

  return {
    withBanner: new URL(origin),
    homemade: new URL(`${origin}/homemade`),
    inIframe: new URL(`${origin}/iframe`),
    unclickable: new URL(`${origin}/unclickable`),
    withoutBanner: new URL(`${origin}/no-banner`),
    refusing: new URL(`${origin}${REFUSING}`),
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
