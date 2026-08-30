import chromium from "@sparticuz/chromium";
import {
  chromium as playwright,
  type Browser,
  type Page,
} from "playwright-core";
import { parseTargetUrl, type TargetRejection } from "./target-url";

/**
 * Which of the two readings of the store a cookie first showed up in.
 *
 * This is the whole point of the scan. A tracker that only fires after the
 * visitor accepts is the store working as it says it does; the same tracker
 * before any interaction is the fact the audit exists to observe.
 */
export type ConsentPhase = "pre-consent" | "post-consent";

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

export type ScanRejection = TargetRejection | "unreachable";

export type Scan =
  | {
      ok: true;
      url: string;
      at: string;
      /**
       * Whether a consent banner answered the scan.
       *
       * False means the store has one state, not two: nothing was asked, so
       * nothing was consented to, and every cookie is a pre-consent cookie.
       */
      consentBanner: boolean;
      cookies: ObservedCookie[];
    }
  | { ok: false; reason: ScanRejection };

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
 * How long to wait for a banner before calling the store bannerless.
 *
 * Banners are injected by a third-party script, so they show up later than the
 * page does. Waiting is what separates "this store asks nothing" from "the scan
 * was faster than the banner", and getting that wrong turns a store that
 * behaves into a store that appears not to.
 */
const BANNER_TIMEOUT_MS = 5_000;

/**
 * What the control that accepts everything says.
 *
 * Anchored at the start, which is what keeps "Rejeitar", "Configurar" and
 * "Gerenciar preferencias" out: none of them open with an accepting word.
 */
const ACCEPTS =
  /^\s*(aceitar|aceito|concordo|permitir|autorizar|entendi|accept|allow|agree|got it|ok)\b/i;

/**
 * An accept that accepts only part of it.
 *
 * "Aceitar apenas os necessários" opens with an accepting word and is the
 * refusal. Clicking it would produce a post-consent state in which nothing
 * fired, and report a store that tracks as a store that does not.
 */
const ACCEPTS_ONLY_SOME =
  /necess|essenci|obrigat|apenas|somente|only|selecion/i;

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

async function load(page: Page, url: URL) {
  // `domcontentloaded`, not `load`: waiting for every image on a shop's home
  // page buys nothing here. Measured against a real store, both readings
  // returned the same 27 cookies, because trackers fire long before the last
  // image lands. On a slow store `load` would blow the timeout and report a
  // page that rendered fine as unreachable.
  await page.goto(url.href, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await page.waitForTimeout(SETTLE_MS);
}

/**
 * Clicks the banner's accept, and reports whether there was one to click.
 *
 * ponytail: matches by role and accessible name, so a banner built out of
 * `<div onclick>` with no role, or one living inside an iframe, reads as no
 * banner at all. Both are common enough in consent platforms to be worth
 * closing — with a per-vendor selector list (OneTrust, Cookiebot, Osano) — once
 * the scan has met enough real stores to know which vendors actually show up.
 */
async function acceptConsentBanner(page: Page): Promise<boolean> {
  const accept = page
    .getByRole("button", { name: ACCEPTS })
    .or(page.getByRole("link", { name: ACCEPTS }))
    .filter({ hasNotText: ACCEPTS_ONLY_SOME })
    .first();

  try {
    await accept.click({ timeout: BANNER_TIMEOUT_MS });
    return true;
  } catch {
    // Nothing to accept: no banner, or one this scan cannot recognise. Either
    // way the store is read as a single state rather than as a failure.
    return false;
  }
}

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
 * test, which serves a store on loopback that the guard would rightly refuse.
 */
export async function observeStore(url: URL): Promise<Scan> {
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

    await load(page, url);
    const beforeConsent = await context.cookies();

    if (!(await acceptConsentBanner(page))) {
      return {
        ok: true,
        url: url.href,
        at: new Date().toISOString(),
        consentBanner: false,
        cookies: observed(beforeConsent, "pre-consent"),
      };
    }

    // The second load, in the same context: consent is now stored wherever the
    // store keeps it, so whatever the banner was holding back fires on an
    // ordinary page view. That is when a consent platform that defers its tags
    // injects them, and the moment a single reload-less reading would miss.
    await load(page, url);
    const afterConsent = await context.cookies();

    const alreadySeen = new Set(beforeConsent.map(cookieKey));

    return {
      ok: true,
      url: url.href,
      at: new Date().toISOString(),
      consentBanner: true,
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
export async function runScan(rawUrl: string): Promise<Scan> {
  const target = await parseTargetUrl(rawUrl);
  if (!target.ok) return { ok: false, reason: target.reason };

  return observeStore(target.url);
}
