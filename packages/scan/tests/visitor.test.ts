import { expect, test } from "vitest";
import { openVisitor } from "../browser";

/**
 * What our browser announces about itself, asked of a real browser.
 *
 * This is the one property of the scan a store can see, and getting it wrong
 * cost us five of nine real Brazilian shops, which answered 403 to
 * `HeadlessChrome` and 200 to the same browser without the word (ADR-0008).
 *
 * It has to run against Chromium and not a mock. The string is no longer read
 * from a page's `navigator.userAgent` — it is asked of the browser over CDP,
 * precisely so that no throwaway context has to be opened to get it — and a
 * mocked CDP session would assert what we wrote down, not what Chromium
 * answers. The mechanism is exactly what is under test here.
 */
test("the visitor is a browser that does not announce itself as headless", async () => {
  const visitor = await openVisitor();
  if (!visitor) throw new Error("the browser did not come up");

  const { browser, page } = visitor;

  try {
    const announced = await page.evaluate(() => navigator.userAgent);

    expect(announced).not.toContain("HeadlessChrome");
    expect(announced).toContain("Chrome/");

    // The other two halves of "the visitor we are measuring for": a Brazilian
    // shopper, not a machine in Washington. A consent platform decides whether
    // to show its banner on exactly this.
    expect(await page.evaluate(() => navigator.language)).toBe("pt-BR");
    expect(
      await page.evaluate(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone
      )
    ).toBe("America/Sao_Paulo");
  } finally {
    await browser.close();
  }
  // Longer than the budget it exercises: `openVisitor` gives itself a minute to
  // produce a browser, so a test that gave up sooner would report a timeout of
  // its own where the code has a real answer — `null`, and the assertion above.
}, 90_000);
