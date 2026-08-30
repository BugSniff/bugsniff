import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Browser } from "playwright-core";
import { parseTargetUrl, type TargetRejection } from "./target-url";

/** A cookie the store's page left behind, as the browser saw it. */
export type ObservedCookie = {
  name: string;
  domain: string;
  /** Seconds since the epoch, or -1 for a cookie that dies with the session. */
  expires: number;
  httpOnly: boolean;
  secure: boolean;
};

export type ScanRejection = TargetRejection | "unreachable";

export type Scan =
  | { ok: true; url: string; at: string; cookies: ObservedCookie[] }
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
 * Runs one scan: opens the store in a real browser and reports the cookies it
 * found there.
 *
 * One store per call, never a batch. Forty stores do not fit in one function's
 * duration budget (ADR-0002), and a batch that times out loses every result in
 * it rather than one.
 */
export async function runScan(rawUrl: string): Promise<Scan> {
  const target = await parseTargetUrl(rawUrl);
  if (!target.ok) return { ok: false, reason: target.reason };

  let browser: Browser | undefined;
  try {
    browser = await openBrowser();

    // A fresh context per scan, so one store never sees another store's
    // cookies — and so the reading is of this store alone.
    const context = await browser.newContext();
    const page = await context.newPage();

    // `domcontentloaded`, not `load`: waiting for every image on a shop's home
    // page buys nothing here. Measured against a real store, both readings
    // returned the same 27 cookies, because trackers fire long before the last
    // image lands. On a slow store `load` would blow the timeout and report a
    // page that rendered fine as unreachable.
    await page.goto(target.url.href, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.waitForTimeout(SETTLE_MS);

    const cookies = await context.cookies();

    return {
      ok: true,
      url: target.url.href,
      at: new Date().toISOString(),
      cookies: cookies.map(({ name, domain, expires, httpOnly, secure }) => ({
        name,
        domain,
        expires,
        httpOnly,
        secure,
      })),
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
