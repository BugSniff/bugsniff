import type { Frame, Page } from "playwright-core";
import { parseTargetUrl } from "../target-url";

/**
 * Finding what the store says it does.
 *
 * The audit compares two things: what the store does, which the readings
 * observe, and what the store declares, which lives in the published policy.
 * This is the second half arriving.
 *
 * Finding it is a search, not a lookup. A shop that publishes a perfectly good
 * policy and a shop we failed to find one on come out of a lookup looking
 * identical, and only one of them deserves what the report will say. So this
 * asks, in order: what the banner linked before we answered it, what the page
 * links by name, what a hub of legal pages leads to, and — last — the handful
 * of addresses where a Brazilian shop's policy actually lives.
 */

/** What a link to the policy itself says, and where it points. */
const POLICY_TEXT =
  /pol[íi]tica\s+de\s+privacidade|aviso\s+de\s+privacidade|privacidade\s+e\s+cookies|privacy\s+policy/i;
const POLICY_HREF =
  /pol[ií]tica[-_]?de[-_]?privacidade|privacy[-_]?policy|aviso[-_]?de[-_]?privacidade/i;

/**
 * And what a page that merely *leads* to the policy says.
 *
 * Measured on havan.com.br, whose home has no link to the policy at all: it
 * has "Políticas e segurança", and the policy is one click behind it. A shop
 * that files its policy in a hub is not a shop without a policy, and reporting
 * it as one would put a false fact in somebody's report.
 */
const HUB_TEXT =
  /pol[íi]ticas|privacidade|lgpd|termos|central\s+de\s+ajuda|pol[íi]tica\s+de\s+cookies|aviso\s+de\s+cookies/i;
const HUB_HREF =
  /politicas|privacidade|privacy|lgpd|termos|politica-de-cookies/i;

/**
 * Anything on the page that might lead somewhere legal, however loosely.
 *
 * Deliberately wider than either pattern above, because it is not used to
 * decide anything: it is used to *record* what the search had in front of it.
 * A shop where we found nothing deserves a report that shows what we looked at
 * — "não encontramos" is a statement about us, and this is what makes it
 * checkable by the person reading it.
 */
const LEGAL_LINK =
  /privac|cookie|pol[íi]tic|lgpd|termo|legal|dados\s+pessoais|prote[çc][ãa]o\s+de\s+dados|compliance/i;

/** What became of a link the search had in front of it. */
export type LinkOutcome =
  /** Opened, read, and it is the policy this reading reports. */
  | "policy"
  /** Opened as a collection of legal pages, and searched from there. */
  | "hub"
  /** We asked and were refused: an error status, or an address we may not open. */
  | "refused"
  /** Opened, and what came back was not the policy. */
  | "not-policy"
  /** Never opened. A better candidate answered first, or the budget ran out. */
  | "not-followed";

/**
 * What the search had in front of it, and what it did with each of them.
 *
 * The evidence behind the sentence the report prints. "Nosso navegador não
 * chegou à política" is honest but unfalsifiable on its own; with this, the
 * person reading can see how many links the page carried, which ones we judged
 * relevant, and what happened when we followed them — including the case that
 * turns up more than anyone expects, which is a policy page that answers 403 to
 * our browser.
 */
export type PolicySearch = {
  /** Every link the store's page carried, counted. */
  seen: number;
  /** The ones whose label or address touched the vocabulary above. */
  candidates: { text: string; url: string; outcome: LinkOutcome }[];
};

/** Enough to show the search was thorough, few enough to be read. */
const MOST_CANDIDATES = 40;

/** How many pages of legal links the search may open before giving up. */
const MOST_HUBS = 3;

/**
 * Where a shop's policy lives when nothing on the page points at it.
 *
 * The last resort, and the one that turns "we found no link" into "we looked".
 * These are not guesses at random: they are what the platforms Brazilian
 * retail runs on mint by default — the plain slug, Shopify's `/policies/`,
 * VTEX's `/institucional/` — plus the two spellings shops write by hand.
 *
 * Only reached when every link failed, and every one of them still has to
 * prove what it is: a store that answers 200 to every address would otherwise
 * hand us its home page and we would file it as the policy.
 */
const WELL_KNOWN = [
  "/politica-de-privacidade",
  "/politicas-de-privacidade",
  "/politica-privacidade",
  "/privacidade",
  "/policies/privacy-policy",
  "/institucional/politica-de-privacidade",
  "/aviso-de-privacidade",
  "/privacy-policy",
];

/** Below this, whatever we landed on is not a privacy policy. */
const SHORTEST_POLICY = 400;

/**
 * Long enough for any policy written by a human, short enough that a page that
 * lies about being a policy cannot fill the table with it.
 */
const LONGEST_POLICY = 120_000;

/**
 * How long to let the page finish rendering before reading it.
 *
 * Measured on americanas.com.br: the policy page answers 200 and is empty at
 * `domcontentloaded`, because the text arrives with the application. Reading
 * too early found nothing and called the page unreadable — a store publishing
 * a perfectly good policy, reported as one we could not read.
 */
const POLICY_SETTLE_MS = 2_000;

/**
 * And how long a policy page gets to finish parsing before we read it anyway.
 *
 * Its own budget, separate from the navigation, for the same reason the scan's
 * own load has one: `domcontentloaded` as the navigation condition makes one
 * timeout answer two questions, and the slow half poisons the fast one.
 * Measured on smiles.com.br, whose document parses for over a minute — every
 * address the search tried burned the full navigation timeout, eight of them in
 * a row, and a scan that should have taken twenty seconds took a hundred and
 * eighty. Well past what one invocation may spend (ADR-0002).
 *
 * Shorter than the store's own, because this page is only ever read for its
 * text: a document still parsing yields a short read, a short read is not a
 * policy, and the search keeps going. It errs towards "we could not read it",
 * which is the direction this whole module errs in.
 */
const POLICY_PARSE_BUDGET_MS = 8_000;

/**
 * How long the whole search may take, from the first link to the last guess.
 *
 * It used to be a budget on the guessing alone, which left the named links and
 * the hub page unbounded — three page loads at up to thirty seconds each,
 * before the part that was budgeted even began. Measured on smiles.com.br,
 * whose document parses for over a minute: the search took forty-two seconds
 * on its own, inside a scan that took a hundred and eighty, in a function that
 * is allowed sixty (ADR-0002).
 *
 * Running out is not a failure of the store. It is us saying we stopped
 * looking, which is the sentence this module already knows how to write.
 */
const POLICY_BUDGET_MS = 25_000;

/**
 * How long the search may spend trying addresses nobody linked.
 *
 * Every scan is one invocation with a duration to answer for (ADR-0002), and
 * this is the only part of the search that pays for a page load per attempt.
 * A shop that answers 404 to a guess costs nothing — the page never renders —
 * so this budget is really about the shop that answers 200 to everything, and
 * it stops us from spending twenty seconds proving it says nothing.
 */
const PROBE_BUDGET_MS = 15_000;

type Reading =
  | { state: "found"; url: string; text: string }
  /**
   * We searched and did not find one.
   *
   * Which is not the same as a store without a policy, and the screen has to
   * keep saying so: this is our browser failing to find, never the store
   * failing to publish.
   */
  | { state: "not-found" }
  /** The link is there and what it opens is not text we can read. */
  | { state: "unreadable"; url: string };

/** The reading, with the search that produced it attached. */
export type PolicyReading = Reading & { survey: PolicySearch };

type LinkPattern = { text: RegExp; href: RegExp };

const POLICY: LinkPattern = { text: POLICY_TEXT, href: POLICY_HREF };
const HUB: LinkPattern = { text: HUB_TEXT, href: HUB_HREF };

/**
 * The address a link in this frame points to, for the first link that fits.
 *
 * Shadow roots included: a consent platform that renders its banner into one —
 * Usercentrics does — keeps its "Política de Privacidade" in there too, and a
 * plain `querySelectorAll` walks straight past it.
 */
async function findLink(
  frame: Frame,
  pattern: LinkPattern
): Promise<string | null> {
  return frame
    .evaluate(
      (patterns) => {
        const byText = new RegExp(patterns.text, "i");
        const byHref = new RegExp(patterns.href, "i");

        const links: HTMLAnchorElement[] = [];
        const collect = (root: Document | ShadowRoot) => {
          links.push(...root.querySelectorAll<HTMLAnchorElement>("a[href]"));
          root
            .querySelectorAll("*")
            .forEach(
              (element) => element.shadowRoot && collect(element.shadowRoot)
            );
        };
        collect(document);

        const label = (link: HTMLAnchorElement) =>
          (
            link.innerText ||
            link.textContent ||
            link.getAttribute("aria-label") ||
            link.getAttribute("title") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

        // What the link says beats where it points: "privacidade" in a URL
        // also matches the privacy settings of a logged-in area, while a link
        // that reads "Política de Privacidade" is never anything else.
        const named = links.find((link) => byText.test(label(link)));
        const pointed = links.find((link) => byHref.test(link.href));

        return (named ?? pointed)?.href ?? null;
      },
      { text: pattern.text.source, href: pattern.href.source }
    )
    .catch(() => null);
}

/**
 * The same search, but keeping more than the first answer.
 *
 * A page that collects a shop's legal documents is rarely the only one linked:
 * "Termos de Uso", "Políticas", "Política de Cookies" sit side by side in the
 * same footer, and the policy hides behind whichever of them the shop chose.
 * Taking only the first spends the shop's one chance on an arbitrary pick.
 */
async function findLinks(
  frame: Frame,
  pattern: LinkPattern,
  most: number
): Promise<string[]> {
  return frame
    .evaluate(
      ({ text, href, most }) => {
        const byText = new RegExp(text, "i");
        const byHref = new RegExp(href, "i");

        const links: HTMLAnchorElement[] = [];
        const collect = (root: Document | ShadowRoot) => {
          links.push(...root.querySelectorAll<HTMLAnchorElement>("a[href]"));
          root
            .querySelectorAll("*")
            .forEach(
              (element) => element.shadowRoot && collect(element.shadowRoot)
            );
        };
        collect(document);

        const label = (link: HTMLAnchorElement) =>
          (
            link.innerText ||
            link.textContent ||
            link.getAttribute("aria-label") ||
            link.getAttribute("title") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

        // Same order as the single-answer search: what the link says beats
        // where it points, so every text match comes before any href match.
        const named = links.filter((link) => byText.test(label(link)));
        const pointed = links.filter((link) => byHref.test(link.href));

        return [
          ...new Set([...named, ...pointed].map((link) => link.href)),
        ].slice(0, most);
      },
      { text: pattern.text.source, href: pattern.href.source, most }
    )
    .catch(() => []);
}

/**
 * The policy link as it stands right now, anywhere on the page.
 *
 * Called before the banner is answered, which is the whole point of it being
 * separate. Measured on duxhumanhealth.com: the only link that reads "Política
 * de Privacidade" lives inside the consent banner, and accepting the banner
 * takes it off the page — so by the time the reading is done and it is safe to
 * navigate away, the one link that named the document is gone. Harvest it
 * while it exists; open it later.
 *
 * Every frame, not just the main one, because TrustArc and some OneTrust
 * deployments put the banner — and therefore the link — in an iframe.
 */
export async function findPolicyLink(page: Page): Promise<string | null> {
  for (const frame of page.frames()) {
    const href = await findLink(frame, POLICY);
    if (href) return href;
  }
  return null;
}

/** The address to open, or null if it is one we should not be opening. */
async function safeToOpen(
  href: string,
  currentPage: string
): Promise<string | null> {
  let link: URL;
  try {
    link = new URL(href);
  } catch {
    return null;
  }

  // A link that stays on this origin needs no second opinion: the origin was
  // cleared before the browser was ever pointed at it.
  if (link.origin === new URL(currentPage).origin) return link.href;

  // One that leaves it goes through the same guard the pasted URL did, and
  // here the reason is sharper: a stranger's store can publish
  // `http://169.254.169.254/` and call it "Política de Privacidade", and we
  // would open it with our own browser and keep whatever came back.
  const target = await parseTargetUrl(link.href);
  return target.ok ? target.url.href : null;
}

/** Opens an address, if we are allowed to, and lets it finish rendering. */
async function open(
  page: Page,
  href: string,
  /** What is left of the search's budget. No attempt may outlive it. */
  left: number
): Promise<string | null> {
  if (left <= 0) return null;

  const url = await safeToOpen(href, page.url());
  if (!url) return null;

  try {
    // `commit`: the address answered, and that is all the navigation timeout is
    // about. Whether its document finishes is a separate question with a
    // separate budget below, and one that is allowed to go unanswered.
    const response = await page.goto(url, {
      waitUntil: "commit",
      timeout: Math.min(20_000, left),
    });
    if ((response?.status() ?? 0) >= 400) return null;
  } catch {
    return null;
  }

  await page
    .waitForLoadState("domcontentloaded", {
      timeout: Math.min(POLICY_PARSE_BUDGET_MS, Math.max(left, 1)),
    })
    .catch(() => {
      // Still parsing. We read what there is; a short read is not a policy and
      // the search moves on.
    });

  await page.waitForTimeout(POLICY_SETTLE_MS);
  return url;
}

/**
 * The text of whatever page we are standing on, stripped of its furniture.
 */
async function readText(page: Page): Promise<string> {
  return page
    .evaluate((limit) => {
      // Stripped in place rather than on a clone: `innerText` needs layout to
      // know where the line breaks go, and a detached copy has none. We are
      // leaving this page anyway.
      document
        .querySelectorAll(
          "script, style, noscript, nav, header, footer, aside, svg, iframe, button, [role=navigation], [role=banner], [role=contentinfo]"
        )
        .forEach((element) => element.remove());

      const main = document.querySelector<HTMLElement>(
        "main, article, [role=main]"
      );

      return ((main ?? document.body).innerText ?? "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, limit);
    }, LONGEST_POLICY)
    .catch(() => "");
}

/**
 * The words a privacy policy uses, for a page that has to identify itself.
 *
 * Needed only where we did not arrive by a link that said "política de
 * privacidade" — there, the page's own vocabulary is the only evidence of what
 * it is. Two of these, not one: a returns policy says "privacidade" in passing
 * and is long enough to pass a length check on its own, and reading it as the
 * privacy policy would put the wrong text under every comparison the audit
 * makes.
 */
const SPEAKS_PRIVACY = [
  /dados\s+pessoais/i,
  /\bprivacidade\b/i,
  /\blgpd\b/i,
  /\btitular(es)?\s+d(os|e)\s+dados\b/i,
  /tratamento\s+de\s+dados/i,
  /lei\s+n?[.º°]*\s*13\.?709/i,
];

const looksLikePolicy = (text: string) =>
  text.length >= SHORTEST_POLICY &&
  SPEAKS_PRIVACY.filter((word) => word.test(text)).length >= 2;

/** What a page calls itself, when what it is is the privacy policy. */
const TITLES_POLICY = /privacidade|privacy|dados\s+pessoais|lgpd/i;

/**
 * Whether the page announces itself as the policy.
 *
 * The guard on guessing an address: a single-page store answers 200 to every
 * address it has never heard of and serves its home page, and a home page that
 * carries a cookie banner says "privacidade" and "dados pessoais" in it —
 * enough to pass a vocabulary check and be filed as the published policy.
 *
 * And the guard on trusting a link, which is the one that was missing.
 * Measured on sephora.com.br: the footer says "Privacidade e Cookies" and
 * opens `/cookies/`, titled "Cookies | Sephora" — long enough to pass, and the
 * wrong document. The real policy sat at `/institucional/politica-de-
 * privacidade`, one guess away, and the search had already stopped.
 */
async function announcesPolicy(page: Page): Promise<boolean> {
  return page
    .evaluate((source) => {
      const says = new RegExp(source, "i");
      const heading = document.querySelector("h1")?.textContent ?? "";
      return says.test(document.title) || says.test(heading);
    }, TITLES_POLICY.source)
    .catch(() => false);
}

/**
 * What opening a link that named itself the policy got us.
 *
 * `speaks` is the page's own evidence that it is what the link said it was —
 * its title, or the words a policy uses. A link is somebody else's claim about
 * a page; this is the page's claim about itself, and the two disagree often
 * enough to be worth keeping apart.
 */
type Opened =
  | { state: "found"; url: string; text: string; speaks: boolean }
  | { state: "unreadable"; url: string };

/** Opens a link that named itself the policy, and reads what came back. */
async function readNamed(
  page: Page,
  href: string,
  left: number
): Promise<Opened> {
  const url = await open(page, href, left);
  if (!url) return { state: "unreadable", url: href };

  // Before `readText`, which strips the page down to its prose.
  const announces = await announcesPolicy(page);
  const text = await readText(page);

  // A policy is a long document. Anything this short is a redirect notice, a
  // cookie wall, or a page saying the policy lives somewhere else.
  if (text.length < SHORTEST_POLICY) return { state: "unreadable", url };

  // The title alone, not the vocabulary. A cookie page says "privacidade" and
  // "dados pessoais" as freely as a policy does — measured on sephora.com.br,
  // where 710 characters about cookies passed a vocabulary check. And being
  // strict here costs nothing: a reading that fails it is kept, not dropped, so
  // the worst case is that the search looks a little further and comes back to
  // it.
  return { state: "found", url, text, speaks: announces };
}

/**
 * Reads the policy the store publishes, searching for it where it hides.
 *
 * Called last, after every reading has been captured: it navigates away from
 * the store, and anything measured after this point would be measuring the
 * policy page instead of the shop.
 *
 * `fromBanner` is the link harvested by `findPolicyLink` before the banner was
 * answered — see there for why it cannot be found from here.
 */
/**
 * Every link on the page, and which of them could lead somewhere legal.
 *
 * Counted, not judged. The number is the point: a report that says we found no
 * policy is worth exactly as much as the evidence that we looked, and "olhamos
 * os 275 links desta página, 7 tinham a ver com o assunto" is that evidence.
 *
 * Shadow roots included, for the same reason as the search itself: a consent
 * platform keeps its links in one.
 */
async function surveyLinks(
  frame: Frame
): Promise<{ seen: number; candidates: { text: string; url: string }[] }> {
  return frame
    .evaluate(
      ({ source, most }) => {
        const legal = new RegExp(source, "i");

        const links: HTMLAnchorElement[] = [];
        const collect = (root: Document | ShadowRoot) => {
          links.push(...root.querySelectorAll<HTMLAnchorElement>("a[href]"));
          root
            .querySelectorAll("*")
            .forEach(
              (element) => element.shadowRoot && collect(element.shadowRoot)
            );
        };
        collect(document);

        const seen = new Map<string, string>();

        for (const link of links) {
          const text = (
            link.innerText ||
            link.textContent ||
            link.getAttribute("aria-label") ||
            link.getAttribute("title") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 90);

          // The same document linked twice from a page is one candidate.
          if (!legal.test(text + " " + link.href)) continue;
          if (!seen.has(link.href)) seen.set(link.href, text);
        }

        return {
          seen: links.length,
          candidates: [...seen]
            .slice(0, most)
            .map(([url, text]) => ({ text, url })),
        };
      },
      { source: LEGAL_LINK.source, most: MOST_CANDIDATES }
    )
    .catch(() => ({ seen: 0, candidates: [] }));
}

/**
 * Reads the policy the store publishes, searching for it where it hides.
 *
 * Called last, after every reading has been captured: it navigates away from
 * the store, and anything measured after this point would be measuring the
 * policy page instead of the shop.
 *
 * The order is what makes it a search rather than a lookup: what the banner
 * linked before we answered it, what the page links by name, what the pages
 * that collect a shop's legal documents lead to, and — last — the handful of
 * addresses where a Brazilian shop's policy actually lives. Everything it did
 * is recorded on the way, because the sentence this can end on is "we did not
 * find one", and that sentence needs to be checkable.
 */
export async function readPolicy(
  page: Page,
  fromBanner?: string | null
): Promise<PolicyReading> {
  const home = page.url();

  // One deadline for the whole search. Every step that loads a page asks how
  // much is left, so no single attempt can outlive the budget the way three
  // unbounded ones used to.
  const deadline = Date.now() + POLICY_BUDGET_MS;
  const left = () => deadline - Date.now();

  // Harvested first, while we are still standing on the store's own page.
  const survey = await surveyLinks(page.mainFrame());

  // What happened to each address we had in front of us. Absent means we never
  // opened it, which is its own honest answer and the default below.
  const outcomes = new Map<string, LinkOutcome>();
  const mark = (url: string | null | undefined, outcome: LinkOutcome) => {
    if (url) outcomes.set(url, outcome);
  };

  const reading = await search();

  return {
    ...reading,
    survey: {
      seen: survey.seen,
      candidates: survey.candidates.map((candidate) => ({
        ...candidate,
        outcome: outcomes.get(candidate.url) ?? "not-followed",
      })),
    },
  };

  async function search(): Promise<Reading> {
    // Both collected before anything navigates: the moment we follow the first
    // candidate, the page that held the others is gone.
    const onPage = await findLink(page.mainFrame(), POLICY);
    const hubs = await findLinks(page.mainFrame(), HUB, MOST_HUBS);

    // Two things worth keeping while the search goes on, neither good enough to
    // stop it. A link that named itself and then failed to open: "the store
    // links a policy we could not read" is not "we found nothing". And a page
    // that opened, is long enough, and never says it is the policy — which is
    // how the cookie page behind "Privacidade e Cookies" gets filed as one.
    // Both are reported only if nothing better turns up, so keeping looking
    // costs a reading nothing and can only trade up.
    let unreadable: Reading | null = null;
    let weak: Reading | null = null;

    const keep = (opened: Opened) => {
      if (opened.state === "unreadable") unreadable ??= opened;
      else weak ??= { state: "found", url: opened.url, text: opened.text };
    };

    for (const href of [fromBanner, onPage]) {
      if (!href) continue;

      const opened = await readNamed(page, href, left());
      if (opened.state === "found" && opened.speaks) {
        mark(href, "policy");
        return { state: "found", url: opened.url, text: opened.text };
      }

      mark(href, opened.state === "unreadable" ? "refused" : "not-policy");
      keep(opened);
    }

    // Nothing named a policy, or nothing named one that opened. Follow the
    // pages that collect a shop's legal documents and look again from there.
    //
    // More than one of them, because the first is not always the right one: a
    // footer that lists "Termos de Uso" before "Política de Cookies" would have
    // spent the shop's only chance on the terms, and the policy is often one
    // click behind the cookie page rather than behind the terms.
    for (const hub of hubs) {
      if (left() <= 0) break;

      const opened = await open(page, hub, left());
      if (!opened) {
        mark(hub, "refused");
        continue;
      }

      mark(hub, "hub");

      const named = await findLink(page.mainFrame(), POLICY);
      if (named) {
        const inside = await readNamed(page, named, left());
        if (inside.state === "found" && inside.speaks) {
          mark(named, "policy");
          return { state: "found", url: inside.url, text: inside.text };
        }
        mark(named, inside.state === "unreadable" ? "refused" : "not-policy");
        keep(inside);
        continue;
      }

      // Some shops link the policy once, from the footer, as plain
      // "Privacidade" — a word that names a subject, not a document. That link
      // *is* the policy, so what we just opened has to identify itself.
      //
      // Same two questions as a named link, and in the same order: what the
      // page calls itself decides, and the vocabulary only keeps it as a
      // fallback. A cookie page reached this way is the same wrong document.
      const announces = await announcesPolicy(page);
      const text = await readText(page);
      if (looksLikePolicy(text)) {
        if (announces) {
          mark(hub, "policy");
          return { state: "found", url: opened, text };
        }
        weak ??= { state: "found", url: opened, text };
      }
    }

    // Nothing on this shop points at its policy. It may still publish one.
    //
    // The guessing gets whatever is left of the search's budget, and no more
    // than it was ever allowed on its own.
    const probing = Date.now() + Math.min(PROBE_BUDGET_MS, left());
    for (const path of WELL_KNOWN) {
      if (Date.now() > probing) break;

      const url = await open(page, new URL(path, home).href, left());
      if (!url) continue;
      if (!(await announcesPolicy(page))) continue;

      const text = await readText(page);
      if (looksLikePolicy(text)) return { state: "found", url, text };
    }

    // Nothing announced itself. A page we opened and could read still beats
    // telling somebody we found nothing.
    return weak ?? unreadable ?? { state: "not-found" };
  }
}
