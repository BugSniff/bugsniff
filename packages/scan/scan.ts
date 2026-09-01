import { type Browser, type Page } from "playwright-core";
import { openBrowser } from "./browser";
import {
  acceptConsentBanner,
  detectConsentPlatform,
} from "./lib/consent-banner";
import {
  findPolicyLink,
  readPolicy,
  type LinkOutcome,
  type PolicyReading,
  type PolicySearch,
} from "./lib/policy";
import { thirdPartyHosts } from "./third-party";
import { parseTargetUrl, type TargetRejection } from "./target-url";

/**
 * Which of the two readings of the store a cookie first showed up in.
 *
 * This is the whole point of the scan. A tracker that only fires after the
 * visitor accepts is the store working as it says it does; the same tracker
 * before any interaction is the fact the audit exists to observe.
 */
export type ConsentPhase = "pre-consent" | "post-consent";

export type { LinkOutcome, PolicyReading, PolicySearch };

/**
 * What the scan can honestly say about the banner.
 *
 * Three, not two. "We did not click" used to cover two opposite facts — the
 * store that asks nothing, and the banner we could not answer — and the second
 * one came out looking like a clean result, which is the worst shape an error
 * can take in an audit.
 */
export type ConsentBannerState =
  /** Found and accepted. The only one confirmed by interaction. */
  | "accepted"
  /** Something asks, and the scan could not answer it. Not a finding: a queue. */
  | "unrecognised"
  /** Our browser found nothing that asks. The screenshot is what backs it. */
  | "not-found";

/**
 * The store's own screen at each reading.
 *
 * Kept for every scan, not only the ones that went wrong. A picture cannot
 * show a cookie — cookies are invisible — so it is never evidence that one was
 * written. What it is evidence of is the screen the visitor was looking at
 * while they were: the banner still asking, with the trackers already there.
 */
export type Evidence = {
  /** Before any interaction. Always taken. */
  preConsent: Buffer | null;
  /** After accepting, when there was something to accept. */
  postConsent: Buffer | null;
};

/**
 * The first half of the reading, handed over as soon as it exists.
 *
 * The banner search can take twenty seconds, and everything in here is already
 * true five seconds in. Waiting for the whole scan to finish before showing any
 * of it is making the person watch a blank screen hold facts we already have.
 */
export type PreConsentReading = {
  cookies: ObservedCookie[];
  requests: ObservedRequest[];
  evidence: Buffer | null;
};

/**
 * A third party the store's page talked to, and when.
 *
 * The host alone, never the URL: the path and the query carry the visitor's
 * own identifiers, and an audit that collects those to prove somebody else
 * collects them has lost its own argument.
 */
export type ObservedRequest = {
  host: string;
  phase: ConsentPhase;
};

/** A cookie the store's page left behind, as the browser saw it. */
export type ObservedCookie = {
  name: string;
  domain: string;
  /** Seconds since the epoch, or -1 for a cookie that dies with the session. */
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  phase: ConsentPhase;
};

export type ScanRejection =
  | TargetRejection
  | "unreachable"
  /** Something answered, and it was not the store. */
  | "blocked"
  /**
   * The store answered and never finished loading, and we saw nothing at all.
   *
   * Kept apart from `unreachable` because it is the opposite fact — the store
   * is up, we ran out of patience — and apart from a clean reading because a
   * page that was still parsing when we stopped watching cannot support the
   * sentence "nenhum cookie foi gravado nesta loja" (#34).
   */
  | "unfinished";

export type Scan =
  | {
      ok: true;
      url: string;
      at: string;
      consentBanner: ConsentBannerState;
      /** The consent platform whose trace was found, when one was. */
      consentPlatform: string | null;
      evidence: Evidence;
      cookies: ObservedCookie[];
      requests: ObservedRequest[];
      /** What the store says it does, as published on the store itself. */
      policy: PolicyReading;
    }
  | {
      ok: false;
      reason: ScanRejection;
      /** The screen that came instead of the store, when there was one. */
      evidence?: Buffer | null;
    };

/** How long the store gets to answer before the scan gives up on it. */
const NAVIGATION_TIMEOUT_MS = 20_000;

/**
 * And how long the document then gets to finish parsing.
 *
 * Its own budget, separate from the navigation, because the two are different
 * questions and conflating them cost us a real store. Measured on
 * smiles.com.br: the server committed a 200 in under a second and
 * `DOMContentLoaded` fired seventy-five seconds later, so a scan that waited
 * for the event as part of navigation timed out and reported "a loja não
 * respondeu a tempo" about a shop that answered immediately — and whose nine
 * cookies were already in the jar at twenty seconds, six of them at three.
 *
 * Expiring here is not a failure. It means we stopped watching, which is a fact
 * about us, and the reading is of what fired before that.
 */
const PARSE_BUDGET_MS = 12_000;

/**
 * How patient the scan is with a document that will not finish.
 *
 * Overridable for one reason: the fixture tests prove that a store which never
 * closes its document is read anyway, and waiting twelve real seconds twice
 * over to prove it adds a minute to a gate that runs on every commit. What is
 * under test is the behaviour, not the number — a one-second budget exercises
 * the same branch.
 *
 * Production passes nothing and gets the constant above.
 */
export type Patience = { parseMs?: number };

/**
 * How long to keep watching after the page reports itself loaded.
 *
 * Analytics and pixels are injected after load far more often than not, so a
 * scan that stops at `load` misses most of what it came for.
 */
const SETTLE_MS = 3_000;

/**
 * How long to look for a banner when nothing says one is coming.
 *
 * Spent on every store that has no banner at all, which is most of them, so it
 * stays short.
 */
const BANNER_BUDGET_MS = 5_000;

/**
 * And how long when a consent platform's trace says one is coming.
 *
 * Worth four times the wait, because here there is evidence it will pay: the
 * machinery is installed, so a banner not showing up yet is more likely to be
 * slow than absent.
 */
const BANNER_BUDGET_WITH_PLATFORM_MS = 20_000;

/**
 * Opens the store, and says whether what answered was the store.
 *
 * A shop that refuses our browser still returns a page, with a title and a
 * body and cookies of its own — and read without looking at the status, that
 * page is indistinguishable from a store that behaves impeccably. Measured on
 * the four stores that came back with nothing to report: centauro, netshoes
 * and casasbahia all answer 403, and havan, which is a real reading, answers
 * 200 with four thousand elements.
 *
 * ponytail: status only. A challenge served with 200 — some Cloudflare
 * interstitials do that — still reads as a store. The next signal to add is
 * the challenge's own wording, and the moment to add it is the first time one
 * shows up in the queue, not before.
 */
async function load(
  page: Page,
  url: URL,
  parseMs: number
): Promise<{ isStore: boolean; parsed: boolean }> {
  // `commit`, which is the moment the response is ours: headers received,
  // navigation committed, the store has answered. That is the only thing the
  // navigation timeout should ever be about.
  //
  // It used to be `domcontentloaded`, and that made one budget answer two
  // questions — "did the store answer" and "did its document finish" — so a
  // shop that answered in under a second and parsed for seventy-five was
  // reported as a shop that was probably offline.
  const response = await page.goto(url.href, {
    waitUntil: "commit",
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  const status = response?.status() ?? 0;
  if (status >= 400) return { isStore: false, parsed: false };

  // Then the document gets its own budget, and is allowed to miss it. Not
  // `load`: waiting for every image on a shop's home page buys nothing here.
  // Measured against a real store, both readings returned the same 27 cookies,
  // because trackers fire long before the last image lands.
  const parsed = await page
    .waitForLoadState("domcontentloaded", { timeout: parseMs })
    .then(() => true)
    .catch(() => false);

  await page.waitForTimeout(SETTLE_MS);
  return { isStore: true, parsed };
}

/**
 * How long any one courtesy step may take before we move on without it.
 *
 * Used for the picture and for telling the page to stop. Both are things we do
 * *to* the page rather than measurements of it, and on a document that will not
 * finish, both queue behind its loading — measured on smiles.com.br, where the
 * screenshot alone took twenty-three seconds and stopping the page took eleven.
 * Neither is worth a second of somebody else's scan.
 */
const COURTESY_BUDGET_MS = 5_000;

/** Whatever this is, it gets this long, and then we carry on without it. */
function atMost<T>(work: Promise<T>, ms: number, instead: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => setTimeout(() => resolve(instead), ms)),
  ]);
}

/**
 * The screen as it stands, small enough to keep.
 *
 * The fold, not the whole page: nobody needs a ten-thousand-pixel column to
 * recognise a banner, and every scan keeps two of these. Budgeted, because a
 * screenshot waits for a frame that a page still parsing may not deliver — and
 * a scan without its picture is still a scan.
 */
const screenshot = async (page: Page) => {
  // The document first, briefly. Navigation now stops at `commit`, so a page we
  // have just decided about — a 403 served in place of the store, above all —
  // may not have drawn a pixel yet, and its picture is the only thing that
  // tells "we were turned away" from "there was nothing to find". Resolves at
  // once on every path that already waited.
  await page
    .waitForLoadState("domcontentloaded", { timeout: COURTESY_BUDGET_MS })
    .catch(() => {});

  return page
    .screenshot({ type: "jpeg", quality: 60, timeout: COURTESY_BUDGET_MS })
    .catch(() => null);
};

/**
 * Tells a page that will not finish loading to stop.
 *
 * Called only when the parse budget ran out, and it is the honest consequence
 * of that: we have decided to stop watching, so we stop the watching. Until
 * this was here, every later step — the picture, the harvest of the policy
 * link, the banner search — queued behind the document's own loading, and the
 * banner search took ninety-seven seconds against a budget of twenty. The
 * budgets were not wrong; nothing was enforcing them.
 *
 * What it costs is real: a tracker that would have fired a minute later does
 * not fire, and does not appear in the reading. That is what a reading with a
 * deadline means, and the alternative measured at three minutes for one store.
 */
const stopLoading = (page: Page) =>
  atMost(
    page.evaluate(() => window.stop()).catch(() => {}),
    COURTESY_BUDGET_MS,
    undefined
  );

/** Identity of a cookie across the two readings — a store may reset its value. */
const cookieKey = (cookie: { name: string; domain: string }) =>
  `${cookie.domain} ${cookie.name}`;

type BrowserCookie = {
  name: string;
  domain: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
};

const asRequests = (hosts: string[], phase: ConsentPhase): ObservedRequest[] =>
  hosts.map((host) => ({ host, phase }));

const observed = (
  cookies: BrowserCookie[],
  phase: ConsentPhase
): ObservedCookie[] =>
  cookies.map(({ name, domain, expires, httpOnly, secure }) => ({
    name,
    domain,
    expires,
    httpOnly,
    secure,
    phase,
  }));

/**
 * Reads a store in its two states: untouched, and after accepting the banner.
 *
 * The URL must already have been through `parseTargetUrl` — this drives a real
 * browser from inside our own network, and that guard is what keeps a stranger
 * from pointing it at the cloud metadata endpoint. Exported for the fixture
 * tests, which serve stores on loopback that the guard would rightly refuse.
 */
export async function observeStore(
  url: URL,
  onPreConsent?: (reading: PreConsentReading) => Promise<void>,
  { parseMs = PARSE_BUDGET_MS }: Patience = {}
): Promise<Scan> {
  let browser: Browser | undefined;
  try {
    browser = await openBrowser();

    // A fresh context per scan, so one store never sees another store's
    // cookies — and so the reading is of this store alone.
    //
    // Brazilian store, Brazilian visitor. A context with no options presents
    // itself as en-US on UTC, and that changes what is being measured: a
    // consent platform configured for Brazil may not show its banner to that
    // visitor at all, and a store that serves English to it may not even write
    // the word the accept control is matched by.
    const context = await browser.newContext({
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });
    const page = await context.newPage();

    // Every URL the page reaches for, from the first byte. Requests are the
    // half of "tracker" that leaves nothing behind: a pixel fired by image or
    // by `sendBeacon` writes no cookie at all, and today the store that only
    // does that comes back with an empty table.
    const reached = new Set<string>();
    page.on("request", (request) => reached.add(request.url()));

    const opened = await load(page, url, parseMs);

    if (!opened.isStore) {
      // Not a clean store: a store we did not read. Saying "no cookies were
      // written" about a page that is not the shop would be the most flattering
      // possible way to be wrong.
      return {
        ok: false,
        reason: "blocked",
        evidence: await screenshot(page),
      };
    }

    if (!opened.parsed) await stopLoading(page);

    const beforeConsent = await context.cookies();
    const beforeHosts = thirdPartyHosts(reached, url);
    const beforeScreen = await screenshot(page);

    // Answered, still parsing when we stopped watching, and nothing to show
    // for it. Every other outcome here is a fact about the store; this one is a
    // fact about the scan, and reporting it as an empty reading would hand the
    // shop the most flattering result the product can produce (#34).
    //
    // A partial reading is not this case. Whatever did fire while we watched is
    // something the browser really observed, and it is reported.
    if (
      !opened.parsed &&
      beforeConsent.length === 0 &&
      beforeHosts.length === 0
    ) {
      return { ok: false, reason: "unfinished", evidence: beforeScreen };
    }

    // Handed over before the banner search, which is the slow part. Whoever is
    // watching gets the pre-consent state at five seconds instead of at
    // twenty-five, and the state that matters most is the one they get first.
    await onPreConsent?.({
      cookies: observed(beforeConsent, "pre-consent"),
      requests: asRequests(beforeHosts, "pre-consent"),
      evidence: beforeScreen,
    }).catch(() => {
      // The screen missing an early update is not worth losing the scan over.
    });

    // Harvested before the banner is answered, because answering it can take
    // the link away: a consent banner is a common — sometimes the only — place
    // a shop links its policy by name, and accepting it removes the banner and
    // the link with it. Opening it now would navigate away mid-reading, so
    // only the address is kept; `readPolicy` follows it at the end.
    const policyLink = await findPolicyLink(page);

    const platform = await detectConsentPlatform(
      page,
      beforeConsent.map(({ name }) => name)
    );

    const banner = await acceptConsentBanner(
      page,
      platform ? BANNER_BUDGET_WITH_PLATFORM_MS : BANNER_BUDGET_MS
    );

    const at = new Date().toISOString();

    if (!banner.accepted) {
      // Nothing was clicked, so the page still stands where a visitor finds
      // it. The screenshot is of exactly that: the store as it looks while it
      // has already written whatever it wrote.
      return {
        ok: true,
        url: url.href,
        at,
        consentBanner: banner.found || platform ? "unrecognised" : "not-found",
        consentPlatform: platform,
        evidence: { preConsent: beforeScreen, postConsent: null },
        cookies: observed(beforeConsent, "pre-consent"),
        requests: asRequests(beforeHosts, "pre-consent"),
        // Last, because it navigates away: anything measured after this would
        // be measuring the policy page instead of the shop.
        policy: await readPolicy(page, policyLink),
      };
    }

    // The second load, in the same context: consent is now stored wherever the
    // store keeps it, so whatever the banner was holding back fires on an
    // ordinary page view. That is when a consent platform that defers its tags
    // injects them, and the moment a single reload-less reading would miss.
    await load(page, url, parseMs);
    const afterConsent = await context.cookies();
    const afterScreen = await screenshot(page);

    const seenHosts = new Set(beforeHosts);
    const afterHosts = thirdPartyHosts(reached, url).filter(
      (host) => !seenHosts.has(host)
    );

    const alreadySeen = new Set(beforeConsent.map(cookieKey));

    return {
      ok: true,
      url: url.href,
      at,
      consentBanner: "accepted",
      consentPlatform: platform,
      evidence: { preConsent: beforeScreen, postConsent: afterScreen },
      policy: await readPolicy(page, policyLink),
      requests: [
        ...asRequests(beforeHosts, "pre-consent"),
        ...asRequests(afterHosts, "post-consent"),
      ],
      cookies: [
        ...observed(beforeConsent, "pre-consent"),
        ...observed(
          afterConsent.filter((cookie) => !alreadySeen.has(cookieKey(cookie))),
          "post-consent"
        ),
      ],
    };
  } catch {
    // Everything the store can do to us lands here: DNS that stopped
    // resolving, a refused connection, a page that never finishes, TLS that
    // does not verify. None of it is worth telling apart for the person who
    // pasted the URL — the store did not answer.
    return { ok: false, reason: "unreachable" };
  } finally {
    await browser?.close();
  }
}

/**
 * Runs one scan: opens the store in a real browser, before and after consent,
 * and reports the cookies each state left behind.
 *
 * One store per call, never a batch. Forty stores do not fit in one function's
 * duration budget (ADR-0002), and a batch that times out loses every result in
 * it rather than one.
 */
export async function runScan(
  rawUrl: string,
  onPreConsent?: (reading: PreConsentReading) => Promise<void>
): Promise<Scan> {
  const target = await parseTargetUrl(rawUrl);
  if (!target.ok) return { ok: false, reason: target.reason };

  return observeStore(target.url, onPreConsent);
}
