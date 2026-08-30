import type { Page } from "playwright-core";
import { parseTargetUrl } from "../target-url";

/**
 * Finding what the store says it does.
 *
 * The audit compares two things: what the store does, which the readings
 * observe, and what the store declares, which lives in the published policy.
 * This is the second half arriving.
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
const HUB_TEXT = /pol[íi]ticas|privacidade|lgpd|termos|central\s+de\s+ajuda/i;
const HUB_HREF = /politicas|privacidade|privacy|lgpd|termos/i;

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

export type PolicyReading =
  | { state: "found"; url: string; text: string }
  /**
   * No link to a policy we could follow from the home page.
   *
   * Which is not the same as a store without a policy, and the screen has to
   * keep saying so: this is our browser failing to find, never the store
   * failing to publish.
   */
  | { state: "not-found" }
  /** The link is there and what it opens is not text we can read. */
  | { state: "unreadable"; url: string };

type LinkPattern = { text: RegExp; href: RegExp };

const POLICY: LinkPattern = { text: POLICY_TEXT, href: POLICY_HREF };
const HUB: LinkPattern = { text: HUB_TEXT, href: HUB_HREF };

/** The address a link on this page points to, for the first link that fits. */
async function findLink(
  page: Page,
  pattern: LinkPattern
): Promise<string | null> {
  return page
    .evaluate(
      (patterns) => {
        const byText = new RegExp(patterns.text, "i");
        const byHref = new RegExp(patterns.href, "i");

        const links = Array.from(
          document.querySelectorAll<HTMLAnchorElement>("a[href]")
        );

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
async function open(page: Page, href: string): Promise<string | null> {
  const url = await safeToOpen(href, page.url());
  if (!url) return null;

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    if ((response?.status() ?? 0) >= 400) return null;
  } catch {
    return null;
  }

  await page.waitForTimeout(POLICY_SETTLE_MS);
  return url;
}

/**
 * Reads the policy the store publishes, if it publishes one where we can see.
 *
 * Called last, after every reading has been captured: it navigates away from
 * the store, and anything measured after this point would be measuring the
 * policy page instead of the shop.
 */
export async function readPolicy(page: Page): Promise<PolicyReading> {
  let href = await findLink(page, POLICY);

  if (!href) {
    // Nothing on the home page points at a policy. Before concluding that,
    // follow the page that collects a shop's legal pages and look again.
    const hub = await findLink(page, HUB);
    if (hub && (await open(page, hub))) href = await findLink(page, POLICY);
  }

  if (!href) return { state: "not-found" };

  const url = await open(page, href);
  if (!url) return { state: "unreadable", url: href };

  const text = await page
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

  // A policy is a long document. Anything this short is a redirect notice, a
  // cookie wall, or a page saying the policy lives somewhere else.
  if (text.length < SHORTEST_POLICY) return { state: "unreadable", url };

  return { state: "found", url, text };
}
