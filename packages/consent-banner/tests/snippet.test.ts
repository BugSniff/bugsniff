import { describe, expect, test } from "vitest";
import { blocklistFrom, type PurposefulTracker } from "../blocklist";
import { bannerSnippet } from "../snippet";
import {
  DEFAULT_SETTINGS,
  settingsFrom,
  type ConsentBannerSettings,
} from "../settings";

/**
 * The file we hand somebody to paste into their own storefront.
 *
 * Two jobs here. The first is that the settings survive the trip intact, since
 * they are the only part of this file that varies. The second is that they
 * cannot do anything on the way: the wording is typed into a form and lands
 * inside a `<script>` element on a live shop, and the whole distance between
 * those two facts is one `<` escape.
 */

const TRACKERS: PurposefulTracker[] = [
  {
    name: "Meta Pixel",
    purpose: "marketing",
    cookie_pattern: "^_fbp$",
    host_pattern: "(^|\\.)facebook\\.net$",
  },
];

const list = blocklistFrom({ cookies: [{ name: "_fbp" }] }, TRACKERS);
const nothing = blocklistFrom({}, TRACKERS);

/** The configuration as the generated file carries it. */
const configIn = (snippet: string) => {
  const line = snippet.match(/var CONFIG = (.+);\n/);
  if (!line) throw new Error("the generated file carries no configuration");
  return JSON.parse(line[1]);
};

const withText = (text: Partial<ConsentBannerSettings["text"]>) => ({
  colors: DEFAULT_SETTINGS.colors,
  text: { ...DEFAULT_SETTINGS.text, ...text },
});

describe("the generated file", () => {
  test("carries the blocklist as data the runtime can read", () => {
    expect(configIn(bannerSnippet(list)).blocked).toEqual(list.blocked);
  });

  test("offers only the purposes the store has", () => {
    expect(configIn(bannerSnippet(list)).purposes).toEqual(["marketing"]);
  });

  test("names what it blocks, for whoever is about to paste it", () => {
    expect(bannerSnippet(list)).toContain("Meta Pixel");
  });

  test("says so out loud when it blocks nothing", () => {
    // A store the reading found nothing on can still install this — it starts
    // mattering the day an app adds a tracker — but it must not be handed over
    // looking like it is doing something today.
    expect(bannerSnippet(nothing)).toContain("não bloqueia nada");
  });

  test("is the same bytes for the same reading and the same settings", () => {
    // Nothing dated and nothing random goes in, so the file on somebody's
    // storefront can be compared against the one on our screen.
    expect(bannerSnippet(list)).toEqual(bannerSnippet(list));
  });
});

describe("wording on its way into a live storefront", () => {
  test("cannot close the script element it travels inside", () => {
    const snippet = bannerSnippet(
      list,
      withText({ acceptAll: "</script><img src=x>" })
    );

    // The one place markup could get in. The label is still there, escaped, and
    // the runtime writes it with `textContent` at the other end.
    expect(snippet).not.toContain("</script><img");
    expect(configIn(snippet).text.acceptAll).toBe("</script><img src=x>");
  });

  test("survives a dollar sign verbatim", () => {
    // `$&` in a replacement string means "whatever matched", and the thing that
    // matched here is the placeholder the configuration replaces.
    const snippet = bannerSnippet(
      list,
      withText({ acceptAll: "Aceitar $& R$" })
    );

    expect(configIn(snippet).text.acceptAll).toBe("Aceitar $& R$");
    expect(snippet).not.toContain("__BUGSNIFF_CONFIG__");
  });
});

describe("the settings, read back from whatever the database holds", () => {
  test("keep a colour that is a colour", () => {
    expect(settingsFrom({ colors: { accent: "#F5A524" } }).colors.accent).toBe(
      "#F5A524"
    );
  });

  test("refuse anything else, because this goes into a stylesheet", () => {
    for (const attempt of [
      "red",
      "#12345",
      "url(javascript:alert(1))",
      "#fff;position:fixed",
      42,
      null,
    ]) {
      expect(settingsFrom({ colors: { accent: attempt } }).colors.accent).toBe(
        DEFAULT_SETTINGS.colors.accent
      );
    }
  });

  test("keep wording the shop wrote", () => {
    expect(
      settingsFrom({ text: { rejectAll: "Não, obrigado" } }).text.rejectAll
    ).toBe("Não, obrigado");
  });

  test("fall back rather than generate a banner with a blank button", () => {
    expect(settingsFrom({ text: { rejectAll: "   " } }).text.rejectAll).toBe(
      DEFAULT_SETTINGS.text.rejectAll
    );
    expect(
      settingsFrom({ text: { rejectAll: "x".repeat(400) } }).text.rejectAll
    ).toBe(DEFAULT_SETTINGS.text.rejectAll);
  });

  test("come out whole from a row that holds nothing", () => {
    // The common case: nobody has customised anything, and there is no row.
    expect(settingsFrom(null)).toEqual(DEFAULT_SETTINGS);
    expect(settingsFrom({})).toEqual(DEFAULT_SETTINGS);
  });
});
