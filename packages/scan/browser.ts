import chromium from "@sparticuz/chromium";
import {
  chromium as playwright,
  type Browser,
  type BrowserContext,
} from "playwright-core";

/**
 * Opens a browser wherever this happens to be running.
 *
 * On Vercel the binary comes from `@sparticuz/chromium`, unpacked from the
 * brotli archives that `next.config.ts` has to force into the deployment. That
 * binary is built for Linux, so a laptop uses the browser it already has —
 * point `CHROME_PATH` at one if the default is wrong.
 *
 * An entry point of its own because two routes open a browser now: the scan,
 * which reads a store, and the report, which prints one. Every route that
 * calls this has to be named in `outputFileTracingIncludes`, or it ships
 * without the binary and dies in production with "cannot find module" — the
 * failure that ADR-0002 exists to warn about, and that a build will not catch.
 */
export async function openBrowser(): Promise<Browser> {
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
 * A context that presents itself the way the visitor we are measuring for does.
 *
 * Everything here is about fidelity of measurement, not politeness. The scan
 * exists to record what a Brazilian shopper's browser gets, and a context with
 * no options is not that browser: it announces `en-US`, it sits on UTC, and it
 * calls itself `HeadlessChrome`. Each of those changes what the store sends
 * back, so each of them is set.
 *
 * The user agent is the one that turned out to matter most, and by a long way.
 * Measured across nine real Brazilian stores: five answered 403 to
 * `HeadlessChrome` and 200 to the same browser with the word removed —
 * centauro, netshoes, casasbahia, magazineluiza, and the airline that publishes
 * the policy for smiles.com.br. Not one store answered differently for the
 * worse. Those readings were not blocked by the shops; they were blocked by us
 * describing ourselves in a way no shopper's browser does.
 *
 * Derived from the browser's own string rather than written by hand, which is
 * why there is a throwaway context above it. A hand-written user agent invents
 * a version and a platform — a Mac token from the Linux box the function runs
 * on — and this way the only difference from the truth is the one word, on a
 * browser that really is Chromium at really that version.
 *
 * What it costs is stated in ADR-0008: a store can no longer tell our browser
 * from a person's by the user agent alone. The counterweight is there too.
 */
export async function visitorContext(
  browser: Browser
): Promise<BrowserContext> {
  const probe = await browser.newContext();
  const page = await probe.newPage();
  const agent = await page.evaluate(() => navigator.userAgent);
  await probe.close();

  return browser.newContext({
    userAgent: agent.replace("HeadlessChrome", "Chrome"),
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
}
