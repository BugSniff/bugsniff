import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { openBrowser } from "../../scan/browser";
import { blocklistFrom, type PurposefulTracker } from "../blocklist";
import { bannerSnippet } from "../snippet";
import { DEFAULT_SETTINGS } from "../settings";
import {
  ANALYTICS,
  ESSENTIAL,
  MARKETING,
  startFixtureShop,
  UNNAMED,
  type FixtureShop,
} from "./fixture-shop";

/**
 * The test that decides whether this feature exists.
 *
 * Everything else about the banner — the wording, the colours, the table on our
 * screen — is presentation. The claim is that a tracker the audit found stops
 * firing until the visitor answers, and the only way to know it is a real
 * browser on a page that really tries. `blocklist.test.ts` checks that the
 * right things end up on the list; this checks that being on the list means
 * anything at all.
 *
 * The untouched shop is read too, and its assertions are not decoration: a
 * pixel that never fires even without a banner would make every other
 * expectation here pass for the wrong reason.
 */

/** The tracker table, as far as this test is concerned. */
const TRACKERS: PurposefulTracker[] = [
  {
    name: "Fixture Analytics",
    purpose: "analytics",
    cookie_pattern: `^${ANALYTICS.cookie}$`,
    host_pattern: `(^|\\.)${ANALYTICS.host}$`,
  },
  {
    name: "Fixture Pixel",
    purpose: "marketing",
    cookie_pattern: `^${MARKETING.cookie}$`,
    host_pattern: `(^|\\.)${MARKETING.host}$`,
  },
  {
    name: "Fixture Fonts",
    purpose: "essential",
    cookie_pattern: null,
    host_pattern: `(^|\\.)${ESSENTIAL.host}$`,
  },
];

/** What a reading of this shop looks like, and therefore what gets blocked. */
const READING = {
  cookies: [{ name: ANALYTICS.cookie }, { name: MARKETING.cookie }],
  requests: [
    { host: ANALYTICS.host },
    { host: MARKETING.host },
    { host: ESSENTIAL.host },
    { host: UNNAMED.host },
  ],
};

/** Long enough for a pixel to leave. Nothing here waits on a network answer. */
const SETTLE_MS = 500;

/** What one visit to the shop came to. */
type Visit = {
  /** Cookies in the jar, by name. */
  cookies: string[];
  /** Hosts the browser was asked to reach, whether or not it got there. */
  hosts: string[];
};

const visits: Record<string, Visit> = {};

/** The three controls, as the browser actually painted them. */
let controls: { labels: string[]; styles: string[] } = {
  labels: [],
  styles: [],
};

let browser: Browser;
let bare: FixtureShop;
let guarded: FixtureShop;

/**
 * Opens the shop, and reports what left the browser while it loaded.
 *
 * Requests are counted from the browser's own event rather than from the
 * server, because the third parties here never resolve: what is being measured
 * is whether the request was made, not whether anybody answered it.
 */
async function open(
  shop: FixtureShop,
  /** What the visitor arrives with, for the visit that is not their first. */
  jar: { name: string; value: string; domain: string; path: string }[] = []
) {
  const context = await browser.newContext({ locale: "pt-BR" });
  if (jar.length > 0) await context.addCookies(jar);
  const page = await context.newPage();

  const hosts: string[] = [];
  page.on("request", (request) => {
    try {
      hosts.push(new URL(request.url()).hostname);
    } catch {
      // Not an address we can attribute. Nothing to record.
    }
  });

  // `domcontentloaded`, not `load`. The third parties here never resolve, and
  // `load` waits for every one of those lookups to give up — the difference
  // between a hook that pauses and one that stalls. What is being measured
  // fires from the inline script, which has already run by this point, and the
  // settle below covers what it starts.
  await page.goto(shop.url.href, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(SETTLE_MS);

  const seen = async (): Promise<Visit> => ({
    cookies: (await context.cookies()).map(({ name }) => name),
    hosts: [...hosts],
  });

  /** Answers the banner and waits out the reload the answer causes. */
  const answer = async (label: string) => {
    hosts.length = 0;
    const navigated = page.waitForEvent("framenavigated");
    await page.locator("button.act", { hasText: label }).first().click();
    await navigated;
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(SETTLE_MS);
  };

  return { page, context, seen, answer };
}

beforeAll(async () => {
  browser = await openBrowser();

  const blocklist = blocklistFrom(READING, TRACKERS);
  const snippet = bannerSnippet(blocklist, DEFAULT_SETTINGS);

  [bare, guarded] = await Promise.all([
    startFixtureShop(),
    startFixtureShop(snippet),
  ]);

  /** One visit, start to finish, in its own context. */
  const flow = async (name: string, run: () => Promise<Visit>) => {
    visits[name] = await run();
  };

  // Every flow at once. Each is a page load plus the settle it waits out, and
  // `pnpm check` runs on every commit — one after another, this hook is the
  // slowest thing in the suite by an order of magnitude.
  await Promise.all([
    // The shop as it stands, which is what every other expectation here is
    // measured against.
    flow("bare", async () => {
      const shop = await open(bare);
      const seen = await shop.seen();
      await shop.context.close();
      return seen;
    }),

    flow("waiting", async () => {
      const shop = await open(guarded);
      const seen = await shop.seen();
      controls = await readControls(shop.page);
      await shop.context.close();
      return seen;
    }),

    flow("accepted", async () => {
      const shop = await open(guarded);
      await shop.answer(DEFAULT_SETTINGS.text.acceptAll);
      const seen = await shop.seen();
      await shop.context.close();
      return seen;
    }),

    flow("refused", async () => {
      const shop = await open(guarded);
      await shop.answer(DEFAULT_SETTINGS.text.rejectAll);
      const seen = await shop.seen();
      await shop.context.close();
      return seen;
    }),

    flow("chosen", async () => {
      const shop = await open(guarded);
      await shop.page
        .locator("button.act", { hasText: DEFAULT_SETTINGS.text.manage })
        .first()
        .click();
      await shop.page.locator('input[data-purpose="analytics"]').check();
      await shop.answer(DEFAULT_SETTINGS.text.save);
      const seen = await shop.seen();
      await shop.context.close();
      return seen;
    }),

    // The visitor who was already being tracked when the banner was installed.
    flow("returning", async () => {
      const shop = await open(guarded, [
        {
          name: ANALYTICS.cookie,
          value: "from-last-month",
          domain: "127.0.0.1",
          path: "/",
        },
      ]);
      const seen = await shop.seen();
      await shop.context.close();
      return seen;
    }),
  ]);
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await Promise.all([bare?.close(), guarded?.close()]);
});

/** The banner's three controls, read out of the shadow root it lives in. */
async function readControls(page: Page) {
  return page.evaluate(() => {
    const mount = document.getElementById("bugsniff-consent");
    const root = mount?.shadowRoot;
    const buttons = [...(root?.querySelectorAll(".acts .act") ?? [])];

    return {
      labels: buttons.map((button) => button.textContent ?? ""),
      // Everything a person reads prominence from, as one string per control.
      styles: buttons.map((button) => {
        const style = getComputedStyle(button);
        const box = button.getBoundingClientRect();
        return [
          style.fontSize,
          style.fontWeight,
          style.backgroundColor,
          style.color,
          style.borderStyle,
          style.borderWidth,
          style.padding,
          style.textTransform,
          style.opacity,
          Math.round(box.width),
          Math.round(box.height),
        ].join(" ");
      }),
    };
  });
}

describe("the shop as it stands, with no banner installed", () => {
  test("tracks whoever shows up", () => {
    expect(visits.bare.cookies).toContain(ANALYTICS.cookie);
    expect(visits.bare.cookies).toContain(MARKETING.cookie);
    expect(visits.bare.hosts).toContain(ANALYTICS.host);
    expect(visits.bare.hosts).toContain(MARKETING.host);
  });
});

describe("before the visitor answers anything", () => {
  test("no cookie on the list is written", () => {
    expect(visits.waiting.cookies).not.toContain(ANALYTICS.cookie);
    expect(visits.waiting.cookies).not.toContain(MARKETING.cookie);
  });

  test("no host on the list is reached, by any of the four routes", () => {
    expect(visits.waiting.hosts).not.toContain(ANALYTICS.host);
    expect(visits.waiting.hosts).not.toContain(MARKETING.host);
  });

  test("the store's own plumbing is left alone", () => {
    expect(visits.waiting.hosts).toContain(ESSENTIAL.host);
  });

  test("and so is the third party we cannot name", () => {
    // Blocking on a guess breaks somebody's checkout. The list only holds what
    // the audit could name, and this is that promise as an assertion.
    expect(visits.waiting.hosts).toContain(UNNAMED.host);
  });
});

describe("the three controls", () => {
  test("are accept, refuse and manage", () => {
    expect(controls.labels).toEqual([
      DEFAULT_SETTINGS.text.acceptAll,
      DEFAULT_SETTINGS.text.rejectAll,
      DEFAULT_SETTINGS.text.manage,
    ]);
  });

  test("are drawn at exactly the same prominence", () => {
    // The product's own criterion, applied to the product. Same size, same
    // weight, same colours, same box — the difference between asking and
    // steering, and the thing the audit writes about other people's banners.
    expect(controls.styles).toHaveLength(3);
    expect(new Set(controls.styles).size).toBe(1);
  });
});

describe("when the visitor accepts everything", () => {
  test("what was held back fires", () => {
    expect(visits.accepted.cookies).toContain(ANALYTICS.cookie);
    expect(visits.accepted.cookies).toContain(MARKETING.cookie);
    expect(visits.accepted.hosts).toContain(ANALYTICS.host);
    expect(visits.accepted.hosts).toContain(MARKETING.host);
  });
});

describe("when the visitor refuses", () => {
  test("nothing on the list fires, then or after the reload", () => {
    expect(visits.refused.cookies).not.toContain(ANALYTICS.cookie);
    expect(visits.refused.cookies).not.toContain(MARKETING.cookie);
    expect(visits.refused.hosts).not.toContain(ANALYTICS.host);
    expect(visits.refused.hosts).not.toContain(MARKETING.host);
  });

  test("and the answer is remembered, so the banner stops asking", () => {
    expect(visits.refused.cookies).toContain("bugsniff_consent");
  });
});

describe("when the visitor picks one purpose and not the other", () => {
  test("only what they agreed to fires", () => {
    expect(visits.chosen.cookies).toContain(ANALYTICS.cookie);
    expect(visits.chosen.hosts).toContain(ANALYTICS.host);
    expect(visits.chosen.cookies).not.toContain(MARKETING.cookie);
    expect(visits.chosen.hosts).not.toContain(MARKETING.host);
  });
});

describe("the visitor who was already being tracked when it was installed", () => {
  test("has the old identifier expired rather than left in place", () => {
    // Two years is a common life for one of these. Holding new writes while
    // leaving the old cookie would leave the person identified by exactly the
    // service they have not agreed to.
    expect(visits.returning.cookies).not.toContain(ANALYTICS.cookie);
  });
});
