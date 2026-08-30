import type { Frame, Page } from "playwright-core";

/**
 * Finding the banner without knowing who built it.
 *
 * Looking a vendor up in a list does not work: the list is endless, and the
 * banner a shop owner's developer wrote in ten minutes is in no list at all.
 * What every consent banner shares is a shape — an overlay pinned to an edge,
 * on top of everything, saying the word "cookie", with something to click
 * inside it. That is what is searched for here.
 *
 * Searching the shape also removes a false positive the previous version had:
 * a hunt for an accept control across the whole page happily clicks "Aceito os
 * termos de uso" in a footer and reports a consent nobody gave. A footer is
 * not fixed, so it is never a banner.
 */

/** What the control that accepts everything says. */
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

/** What a banner talks about, whoever wrote it. */
const CONSENT_TEXT =
  /cookie|privacidade|privacy|lgpd|dados pessoais|consentimento|consent/i;

/**
 * Consent platforms by the trace they leave, in cookie names and script URLs.
 *
 * This is NOT how the banner is found — the shape is. A fingerprint means the
 * machinery is installed, which is a different claim from "a banner was shown
 * to this visitor": these are configured per country, and one set up for
 * Europe loads its script here and never asks anything.
 *
 * What it is good for: knowing a banner is worth waiting longer for, and
 * telling the review queue which vendor to go teach the scan about.
 */
const PLATFORMS: [RegExp, string][] = [
  [/onetrust|otsdkstub|optanon/i, "OneTrust"],
  [/cookiebot|cookieconsent/i, "Cookiebot"],
  [/usercentrics/i, "Usercentrics"],
  [/adopt/i, "AdOpt"],
  [/didomi|euconsent/i, "Didomi"],
  [/cookieyes/i, "CookieYes"],
  [/iubenda/i, "Iubenda"],
  [/cookie-script/i, "CookieScript"],
  [/osano/i, "Osano"],
];

/** How often to look again while the banner's script is still arriving. */
const RETRY_MS = 500;

/**
 * How long a banner that is already on screen gets to grow its accept control.
 *
 * The budget above is for the banner to *appear*. Once it has, waiting the
 * rest of it out buys almost nothing: a platform that rendered its box renders
 * its buttons in the same breath, give or take a frame. This is the difference
 * between answering "we could not accept this" in two seconds and in twenty.
 */
const GRACE_MS = 2_000;

export type BannerSearch = {
  /** Something banner-shaped is on the page. */
  found: boolean;
  /** We answered it. The only outcome confirmed by interaction. */
  accepted: boolean;
};

/**
 * Runs in the browser: finds the banner by shape, and the accept inside it.
 *
 * Written as a string-free function that takes its patterns as sources, since
 * regexes do not survive the trip into the page.
 */
function searchInPage(patterns: {
  accepts: string;
  acceptsOnlySome: string;
  consentText: string;
  /** The floor below which a fixed box is a badge, not a banner. */
  smallestArea: number;
  /**
   * Whether the banner still has to look like one here.
   *
   * False inside a frame that the parent already established is banner-shaped:
   * the shape belongs to the `<iframe>` element out there, while in here the
   * banner is just an ordinary page.
   */
  requireShape: boolean;
}) {
  const accepts = new RegExp(patterns.accepts, "i");
  const acceptsOnlySome = new RegExp(patterns.acceptsOnlySome, "i");
  const consentText = new RegExp(patterns.consentText, "i");

  /** Everything, including what lives inside an open shadow root. */
  function* everything(
    root: Document | ShadowRoot | Element
  ): Generator<Element> {
    for (const element of root.querySelectorAll("*")) {
      yield element;
      if (element.shadowRoot) yield* everything(element.shadowRoot);
    }
  }

  const label = (element: Element) =>
    ((element as HTMLElement).innerText || element.textContent || "")
      .replace(/\s+/g, " ")
      .trim();

  const regions: { element: Element; area: number }[] = [];

  if (patterns.requireShape) {
    for (const element of everything(document)) {
      const style = getComputedStyle(element);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (Number(style.opacity) === 0) continue;

      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < patterns.smallestArea) continue;
      if (!consentText.test(label(element))) continue;

      regions.push({ element, area });
    }
  } else if (consentText.test(label(document.body))) {
    regions.push({ element: document.body, area: 0 });
  }

  if (regions.length === 0) return { found: false, accept: null };

  // Smallest first, so a full-page wrapper never wins over the banner inside
  // it — and the click lands on the banner's own button.
  regions.sort((a, b) => a.area - b.area);

  for (const { element } of regions) {
    const controls = new Set<Element>();
    for (const candidate of everything(element)) {
      const clickable =
        candidate.matches(
          "button, a, [role=button], [onclick], input[type=button], input[type=submit]"
        ) || getComputedStyle(candidate).cursor === "pointer";
      if (clickable) controls.add(candidate);
    }

    for (const control of controls) {
      const text = label(control);
      if (!text || text.length > 60) continue;
      if (!accepts.test(text) || acceptsOnlySome.test(text)) continue;
      return { found: true, accept: control };
    }
  }

  return { found: true, accept: null };
}

/** A banner is a box, not a badge. */
const SMALLEST_BANNER_AREA = 5000;

const PATTERNS = {
  accepts: ACCEPTS.source,
  acceptsOnlySome: ACCEPTS_ONLY_SOME.source,
  consentText: CONSENT_TEXT.source,
  smallestArea: SMALLEST_BANNER_AREA,
};

/**
 * Whether this frame is itself the banner.
 *
 * TrustArc and some OneTrust deployments put the banner in an iframe, and then
 * the shape is out here — the `<iframe>` element pinned over the page — while
 * the button to click is in there. Asking the frame to look like a banner from
 * the inside finds nothing: from the inside it is an ordinary little page.
 */
async function isBannerFrame(frame: Frame): Promise<boolean> {
  const element = await frame.frameElement().catch(() => null);
  if (!element) return false;

  try {
    return await element.evaluate((iframe: Element, floor: number) => {
      for (let node: Element | null = iframe; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.position !== "fixed" && style.position !== "sticky") continue;
        if (style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        return rect.width * rect.height >= floor;
      }
      return false;
    }, SMALLEST_BANNER_AREA);
  } catch {
    return false;
  } finally {
    await element.dispose();
  }
}

/** How long to insist on a control before calling it unanswerable. */
const CLICK_TIMEOUT_MS = 2_000;

/** How long to give the banner to take itself off the screen. */
const AFTER_CLICK_MS = 1_000;

/** One look, in one frame. */
async function look(frame: Frame, requireShape: boolean) {
  const result = await frame.evaluateHandle(searchInPage, {
    ...PATTERNS,
    requireShape,
  });

  const found = Boolean(await (await result.getProperty("found")).jsonValue());
  const accept = (await result.getProperty("accept")).asElement();

  return { found, accept, dispose: () => result.dispose() };
}

async function searchFrame(
  frame: Frame,
  requireShape: boolean
): Promise<BannerSearch> {
  const { found, accept, dispose } = await look(frame, requireShape);

  try {
    if (!accept) return { found, accepted: false };

    try {
      await accept.click({ timeout: CLICK_TIMEOUT_MS });
      return { found: true, accepted: true };
    } catch {
      // A real click gets intercepted by whatever sits in front of the banner
      // — most often a promotional modal's backdrop, a shape Brazilian retail
      // is fond of. Measured on americanas.com.br: banner present, "Aceitar"
      // present, and the click landing on an Oreo advertisement.
      //
      // The control is still there and still listening, so the event goes
      // straight to it.
      try {
        await accept.evaluate((control: HTMLElement) => control.click());
      } catch {
        return { found: true, accepted: false };
      }
    }
  } finally {
    await dispose();
  }

  // A dispatched click never throws and never says whether anything listened.
  // A banner that took the answer takes itself off the screen, so ask again —
  // claiming an acceptance that never happened would report an empty
  // post-consent state as if the store had nothing more to fire.
  await frame.waitForTimeout(AFTER_CLICK_MS);
  const after = await look(frame, requireShape);
  await after.dispose();

  return { found: true, accepted: !after.found };
}

/**
 * Looks for the banner until the budget runs out, and accepts it if it can.
 *
 * The budget is time, not tries: a banner arrives with its vendor's script, so
 * it shows up later than the page does, and a scan faster than the banner
 * reports a store that asks nothing.
 *
 * Every frame is searched, not just the main document: TrustArc and some
 * OneTrust deployments put the banner in an iframe.
 */
export async function acceptConsentBanner(
  page: Page,
  budgetMs: number
): Promise<BannerSearch> {
  let deadline = Date.now() + budgetMs;
  let seen = false;

  do {
    for (const frame of page.frames()) {
      let search: BannerSearch;
      try {
        const main = frame === page.mainFrame();
        // Only a frame the page has put in a banner's place gets to skip the
        // shape test — otherwise any fixed widget with an "Accept" in it, a
        // chat box included, would count as consent.
        if (!main && !(await isBannerFrame(frame))) continue;
        search = await searchFrame(frame, main);
      } catch {
        // A frame that navigated or died mid-search. Nothing to say about it.
        continue;
      }

      if (search.accepted) return search;

      if (search.found && !seen) {
        seen = true;
        deadline = Math.min(deadline, Date.now() + GRACE_MS);
      }
    }

    if (Date.now() < deadline) await page.waitForTimeout(RETRY_MS);
  } while (Date.now() < deadline);

  return { found: seen, accepted: false };
}

/**
 * Which consent platform left its trace, if any did.
 *
 * Not proof that a banner was shown — see PLATFORMS above.
 */
export async function detectConsentPlatform(
  page: Page,
  cookieNames: string[]
): Promise<string | null> {
  let scripts: string[] = [];
  let iab = false;

  try {
    ({ scripts, iab } = await page.evaluate(() => ({
      scripts: Array.from(document.scripts)
        .map((script) => script.src)
        .filter(Boolean),
      iab:
        typeof (window as unknown as { __tcfapi?: unknown }).__tcfapi ===
          "function" ||
        typeof (window as unknown as { __gpp?: unknown }).__gpp ===
          "function" ||
        typeof (window as unknown as { __uspapi?: unknown }).__uspapi ===
          "function",
    })));
  } catch {
    // The page is gone. The cookie names still say something.
  }

  const haystack = [...scripts, ...cookieNames].join(" ");
  const platform = PLATFORMS.find(([trace]) => trace.test(haystack));
  if (platform) return platform[1];

  return iab ? "IAB TCF" : null;
}
