import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Browser } from "playwright-core";

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
