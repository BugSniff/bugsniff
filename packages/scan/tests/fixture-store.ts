import { createServer, type Server } from "node:http";
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
 *
 * One server per shop, not one server with a path per shop. The policy search
 * ends by trying addresses on the shop's own origin, so a shared origin would
 * let one shop's published policy answer for a shop that publishes none — and
 * the test that matters most here is the one that has to keep finding nothing.
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
    // Removed, not hidden, because that is what a consent platform does — and
    // it takes with it any link the banner was carrying.
    if (banner) banner.remove();
  }
  // A banner arrives with its vendor's script, never with the page — and never
  // again once it has been answered. The scan reloads the store after
  // accepting, and a banner that came back on that load would hand the scan a
  // second chance at every link it was carrying, which no real platform gives.
  function showBannerLater() {
    var banner = document.getElementById("banner");
    // Gone from the document, not merely hidden: a hidden element still
    // carries its text and its links, and a scan reading textContent would
    // keep finding a link the visitor can no longer see.
    if (document.cookie.includes("fixture_consent=")) return banner.remove();
    setTimeout(function () {
      banner.hidden = false;
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
 * The published policy, and the link a store puts in its footer.
 *
 * Long on purpose: a policy is a long document, and the scan refuses anything
 * short enough to be a redirect notice or a cookie wall pretending to be one.
 */
const POLICY_LINK = `<footer><a href="/politica-de-privacidade">Política de Privacidade</a></footer>`;

const POLICY_BODY = `Esta política descreve como tratamos dados pessoais dos
visitantes desta loja, para que finalidades, por quanto tempo e com quem eles
são compartilhados. `.repeat(6);

const POLICY = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Política de Privacidade</title></head>
<body>
<nav>Início Produtos Carrinho Minha conta</nav>
<header>Loja de teste</header>
<main>
  <h1>Política de Privacidade</h1>
  <p>${POLICY_BODY}</p>
  <p>Utilizamos cookies de terceiros para medir audiência.</p>
</main>
<footer>Rodapé com endereço, CNPJ e telefone de contato</footer>
</body>
</html>
`;

/**
 * The shop whose only link to the policy is inside the banner.
 *
 * Measured on duxhumanhealth.com. Nothing in the footer names the document;
 * the one link that does sits in the consent banner and leaves with it the
 * moment the banner is accepted — which is exactly when the scan used to go
 * looking. The link has to be harvested before the click or it does not exist.
 *
 * Published at an address no guess would reach, on purpose: with the policy at
 * a predictable slug the search finds it anyway, and the test would pass with
 * the harvest torn out.
 */
const UNGUESSABLE = "/institucional/documentos/lgpd-2026";

const POLICY_IN_BANNER = html(`
<div id="banner" hidden style="${BANNER_STYLE}">
  <p>Este site usa cookies. Leia a
    <a href="${UNGUESSABLE}">Política de Privacidade</a>.</p>
  <button onclick="consent('all')">Aceitar todos</button>
</div>
<script>showBannerLater()</script>
`);

/**
 * A shop whose only link to the policy says just "Privacidade".
 *
 * Measured on duxhumanhealth.com too: a word that names a subject, not a
 * document — and it opens the policy directly, which used to be thrown away
 * for not linking to itself.
 */
const ONLY_PRIVACIDADE = `<footer><a href="/privacidade">Privacidade</a></footer>`;

const IS_THE_POLICY = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Privacidade</title></head>
<body>
<main>
  <h1>Privacidade</h1>
  <p>${POLICY_BODY}</p>
  <p>Tratamento de dados conforme a Lei nº 13.709 e os direitos do titular.</p>
</main>
</body>
</html>
`;

/**
 * And the shop that must keep answering "not-found".
 *
 * Measured on lustresgenesis.com.br: the only footer link matching the hub
 * pattern is "Políticas de Trocas e Devoluções", a page long enough to pass a
 * length check on its own. Reading it as the privacy policy would put the
 * wrong text under every comparison the audit makes.
 */
const ONLY_TROCAS = `<footer><a href="/trocas">Políticas de Trocas e Devoluções</a></footer>`;

const IS_NOT_THE_POLICY = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Trocas e Devoluções</title></head>
<body>
<main>
  <h1>Políticas de Trocas e Devoluções</h1>
  <p>${`O produto pode ser devolvido em até sete dias corridos a contar do
recebimento, desde que esteja em sua embalagem original e sem sinais de uso. `.repeat(
    6
  )}</p>
</main>
</body>
</html>
`;

/**
 * The shop whose footer link points at the cookie page, not the policy.
 *
 * Measured on sephora.com.br: the footer reads "Privacidade e Cookies" and
 * opens a page titled "Cookies", long enough to pass a length check and
 * talkative enough about dados pessoais to pass a vocabulary one. The real
 * policy was published all along, and the search had already stopped. What
 * separates the two is the only thing the cookie page will not claim: the
 * title.
 */
const COOKIES_LINK = `<footer><a href="/cookies">Privacidade e Cookies</a></footer>`;

const IS_THE_COOKIE_PAGE = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Cookies</title></head>
<body>
<main>
  <h1>Cookies</h1>
  <p>${`Usamos cookies próprios e de terceiros nesta loja. Alguns tratam dados
pessoais e você pode gerenciar suas escolhas de privacidade a qualquer momento
nesta página. `.repeat(4)}</p>
</main>
</body>
</html>
`;

/**
 * The shop that answers 200 to every address, with its home page.
 *
 * The trap that blind address probing walks into: ask a single-page store for
 * `/politica-de-privacidade` and it hands back the shop, which is long and
 * talks about dados pessoais because its cookie notice does. Filed as the
 * published policy, it would put the shop's own marketing under every
 * comparison the audit makes.
 */
const CATCH_ALL = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Loja de teste</title></head>
<body>
<h1>Loja de teste</h1>
<main>
  <p>${`Aqui você encontra as melhores ofertas. Respeitamos sua privacidade e
tratamos dados pessoais com cuidado em toda a navegação da loja. `.repeat(
    8
  )}</p>
</main>
</body>
</html>
`;

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

const withFooter = (page: string, footer: string) =>
  page.replace("</body>", `${footer}</body>`);

/** Enough bytes that the parser starts before the response is over. */
const PADDING = `<!-- ${"pad ".repeat(600)} -->`;

/** Answers, writes a tracker, and never closes the document. */
const NEVER_FINISHES = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Loja lenta</title>
${PADDING}
<script>
  document.cookie = "${TRACKER_BEFORE}=1; path=/; max-age=3600";
  new Image().src = "http://${THIRD_PARTY_BEFORE}/px.gif";
</script>
</head>
<body><h1>Loja lenta</h1>
`;

/**
 * And one that answers, writes nothing, and never closes either.
 *
 * The case that must not come back as a clean store: the reading is empty
 * because we stopped watching, not because the shop did nothing (#34).
 */
const NEVER_FINISHES_BLANK = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Loja muda</title>
${PADDING}
</head>
<body>
`;

type Shop = {
  pages: Record<string, string>;
  /** Answered for every address, when this shop is one that never 404s. */
  catchAll?: string;
  /** Answered with 403, as a shop that refuses our browser does. */
  refuses?: boolean;
  /**
   * Answers the home page with this much, and then never finishes.
   *
   * The shape measured on smiles.com.br: a 200 in under a second and a document
   * that goes on parsing for over a minute. The scan used to wait for
   * `DOMContentLoaded` as part of navigation and report the shop as probably
   * offline — the most unfair sentence the product can write, about a store
   * that answered immediately.
   *
   * Only the home page hangs. Everything else 404s at once, so the policy
   * search does not spend a budget per guessed address.
   */
  hangs?: string;
};

/**
 * Every shop, by the name the tests know it as.
 *
 * Each one gets its own server, and therefore its own origin: the search for a
 * policy ends by trying addresses, and an address is a fact about one shop.
 */
const SHOPS = {
  /** Real buttons, with the refusal listed before the accept. */
  withBanner: {
    pages: {
      "/": withFooter(WITH_BANNER, POLICY_LINK),
      "/politica-de-privacidade": POLICY,
    },
  },
  /** No vendor, no button element: a div with an onclick. */
  homemade: { pages: { "/": HOMEMADE } },
  /** The banner lives in an iframe. */
  inIframe: { pages: { "/": IN_IFRAME, "/banner-frame": BANNER_FRAME } },
  /** Consent machinery present, nothing to click, and a footer trap. */
  unclickable: { pages: { "/": withFooter(UNCLICKABLE, FOOTER_TRAP) } },
  /** Asks nothing, and carries the same footer trap. */
  withoutBanner: { pages: { "/": withFooter(NO_BANNER, FOOTER_TRAP) } },
  /** Answers 403 with a page that is not the store. */
  refusing: { pages: {}, refuses: true },
  /** Names the policy only inside the banner, which the accept removes. */
  policyInBanner: {
    pages: { "/": POLICY_IN_BANNER, [UNGUESSABLE]: POLICY },
  },
  /** Links the policy as plain "Privacidade", and that link is the policy. */
  onlyPrivacidade: {
    pages: {
      "/": withFooter(NO_BANNER, ONLY_PRIVACIDADE),
      "/privacidade": IS_THE_POLICY,
    },
  },
  /** Links only a returns policy, which is long and is not the policy. */
  onlyTrocas: {
    pages: {
      "/": withFooter(NO_BANNER, ONLY_TROCAS),
      "/trocas": IS_NOT_THE_POLICY,
    },
  },
  /** Links "Privacidade e Cookies", which opens the cookie page. */
  cookiesFirst: {
    pages: {
      "/": withFooter(NO_BANNER, COOKIES_LINK),
      "/cookies": IS_THE_COOKIE_PAGE,
      "/politica-de-privacidade": POLICY,
    },
  },
  /** Publishes a policy and links it from nowhere at all. */
  unlinked: {
    pages: { "/": NO_BANNER, "/politica-de-privacidade": POLICY },
  },
  /** Answers its home page to every address, policy included. */
  catchAll: { pages: {}, catchAll: CATCH_ALL },
  /** Answers fast, fires a tracker, and never finishes parsing. */
  stillParsing: { pages: {}, hangs: NEVER_FINISHES },
  /** Answers fast, never finishes, and gives us nothing to report. */
  stillParsingBlank: { pages: {}, hangs: NEVER_FINISHES_BLANK },
} satisfies Record<string, Shop>;

export type FixtureStore = Record<keyof typeof SHOPS, URL> & {
  close: () => Promise<void>;
};

function serve(shop: Shop): Promise<{ server: Server; origin: string }> {
  const server = createServer((request, response) => {
    const path = request.url ?? "/";

    // Answers and stays open. No `end`, so the document never closes and
    // `DOMContentLoaded` never fires — which is the whole point of this shop.
    if (shop.hangs !== undefined && path === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.write(shop.hangs);
      return;
    }

    const page = shop.pages[path] ?? shop.catchAll;

    response.writeHead(shop.refuses ? 403 : page ? 200 : 404, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(shop.refuses ? REFUSED : (page ?? "<p>not here</p>"));
  });

  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    })
  );
}

export async function startFixtureStore(): Promise<FixtureStore> {
  const names = Object.keys(SHOPS) as (keyof typeof SHOPS)[];
  const started = await Promise.all(names.map((name) => serve(SHOPS[name])));

  const urls = Object.fromEntries(
    names.map((name, index) => [name, new URL(started[index].origin)])
  ) as Record<keyof typeof SHOPS, URL>;

  return {
    ...urls,
    close: async () => {
      await Promise.all(
        started.map(({ server }) => {
          // Chromium keeps its connection alive, and `close` waits for every
          // open one — without this the fixture never shuts down and the run
          // hangs.
          server.closeAllConnections();
          return new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
          );
        })
      );
    },
  };
}
