import chromium from "@sparticuz/chromium";
import {
  chromium as playwright,
  type Browser,
  type BrowserContext,
  type Page,
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
 * why it is asked for rather than composed. A hand-written user agent invents a
 * version and a platform — a Mac token from the Linux box the function runs on
 * — and this way the only difference from the truth is the one word, on a
 * browser that really is Chromium at really that version.
 *
 * What it costs is stated in ADR-0008: a store can no longer tell our browser
 * from a person's by the user agent alone. The counterweight is there too.
 */
export async function visitorContext(
  browser: Browser
): Promise<BrowserContext> {
  // Asked of the browser, over a session attached to the browser itself. It
  // used to be read from `navigator.userAgent` on a page in a throwaway
  // context, and that second context is what this line exists to not create:
  // `chromium.args` ships `--single-process`, where the renderer lives in the
  // browser's own process, and opening a context, tearing it down and opening
  // another one is a known way to deadlock that process. A deadlock here is the
  // worst-shaped failure this codebase has — before any reading exists, with no
  // exception to catch, so the invocation is killed from outside and the row
  // stays `running` forever.
  //
  // `Browser.getVersion` returns the same string the throwaway page was being
  // asked for, from the same browser, without a page or a context to do it.
  const session = await browser.newBrowserCDPSession();
  const { userAgent } = await session.send("Browser.getVersion");
  await session.detach();

  return browser.newContext({
    userAgent: userAgent.replace("HeadlessChrome", "Chrome"),
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
}

/**
 * How long the browser gets to come up before we call it a failure of ours.
 *
 * Playwright's own launch timeout does not cover this stretch. The binary is
 * unpacked from 64MB of brotli before `launch` is called, and the context and
 * the first page come after it returns — and every one of those steps has hung
 * in production for longer than the invocation was allowed to live.
 *
 * Generous on purpose, and measured against the worker's own 180s: a cold start
 * really does spend twenty-odd seconds unpacking Chromium, and killing a
 * browser that was about to work would trade a stuck exam for a failed one.
 * What this number is for is the hang that never ends, not the slow start.
 */
const OPEN_BUDGET_MS = 60_000;

/** A browser, and the page a store is about to be read in. */
export type Visitor = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

/** Rejects rather than resolving late, so a hang becomes something catchable. */
function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  return Promise.race([
    work,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} timed out`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function open(): Promise<Visitor> {
  const browser = await openBrowser();
  const context = await visitorContext(browser);
  return { browser, context, page: await context.newPage() };
}

/**
 * Everything the scan needs before it can look at a store, or nothing.
 *
 * A deadline, and it is the whole point of this function. Until it existed, a
 * browser that would not come up did not fail — it hung, the invocation was
 * killed from outside at `maxDuration`, and the scan's own `catch` never ran.
 * No result, no reason, no row: the exam sat on "esperando" until the queue's
 * requeue picked it up and it hung again. Every path out of here now either
 * hands back a working browser or says it could not get one.
 *
 * `null` and not a thrown error, because the caller has one honest thing to say
 * about a store it never opened, and it is not about the store.
 */
export async function openVisitor(): Promise<Visitor | null> {
  const opening = open();

  try {
    return await within(opening, OPEN_BUDGET_MS, "opening the browser");
  } catch {
    // A browser that comes up after we stopped waiting still owns a process,
    // and on a laptop nothing else will ever close it.
    void opening.then(({ browser }) => browser.close()).catch(() => {});
    return null;
  }
}
