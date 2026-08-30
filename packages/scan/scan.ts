import chromium from "@sparticuz/chromium";
import {
  chromium as playwright,
  type Browser,
  type Page,
} from "playwright-core";
import {
  acceptConsentBanner,
  detectConsentPlatform,
} from "./lib/consent-banner";
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
  | "blocked";

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
 * Opens a browser wherever this happens to be running.
 *
 * On Vercel the binary comes from `@sparticuz/chromium`, unpacked from the
 * brotli archives that `next.config.ts` has to force into the deployment. That
 * binary is built for Linux, so a laptop uses the browser it already has —
 * point `CHROME_PATH` at one if the default is wrong.
 */
async function openBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    return playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return playwright.launch({
    executablePath:
      process.env.CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
}

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
async function load(page: Page, url: URL): Promise<{ isStore: boolean }> {
  // `domcontentloaded`, not `load`: waiting for every image on a shop's home
  // page buys nothing here. Measured against a real store, both readings
  // returned the same 27 cookies, because trackers fire long before the last
  // image lands. On a slow store `load` would blow the timeout and report a
  // page that rendered fine as unreachable.
  const response = await page.goto(url.href, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  const status = response?.status() ?? 0;
  if (status >= 400) return { isStore: false };

  await page.waitForTimeout(SETTLE_MS);
  return { isStore: true };
}

/**
 * The screen as it stands, small enough to keep.
 *
 * The fold, not the whole page: nobody needs a ten-thousand-pixel column to
 * recognise a banner, and every scan keeps two of these.
 */
const screenshot = (page: Page) =>
  page.screenshot({ type: "jpeg", quality: 60 }).catch(() => null);

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
  onPreConsent?: (reading: PreConsentReading) => Promise<void>
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

    if (!(await load(page, url)).isStore) {
      // Not a clean store: a store we did not read. Saying "no cookies were
      // written" about a page that is not the shop would be the most flattering
      // possible way to be wrong.
      return {
        ok: false,
        reason: "blocked",
        evidence: await screenshot(page),
      };
    }

    const beforeConsent = await context.cookies();
    const beforeHosts = thirdPartyHosts(reached, url);
    const beforeScreen = await screenshot(page);

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
      };
    }

    // The second load, in the same context: consent is now stored wherever the
    // store keeps it, so whatever the banner was holding back fires on an
    // ordinary page view. That is when a consent platform that defers its tags
    // injects them, and the moment a single reload-less reading would miss.
    await load(page, url);
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
