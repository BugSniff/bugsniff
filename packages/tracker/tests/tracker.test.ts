import { describe, expect, test } from "vitest";
import { nameCookie, nameHost, namedTrackers, type Tracker } from "../index";

/**
 * The same rows the migration seeds, for the services the issue names.
 *
 * Copied rather than read from the database on purpose: this test is about the
 * matching, and a test that talks to Supabase would fail for reasons that have
 * nothing to do with whether `_fbp` is a Meta Pixel.
 */
const TRACKERS: Tracker[] = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$|^_fbc$",
    host_pattern: "(^|\\.)facebook\\.(net|com)$",
  },
  {
    name: "Google Analytics",
    cookie_pattern: "^_ga|^_gid$|^_gat",
    host_pattern: "(^|\\.)google-analytics\\.com$",
  },
  { name: "Google Ads", cookie_pattern: "^_gcl_", host_pattern: null },
  {
    name: "TikTok",
    cookie_pattern: "^_ttp$|^_tt_|^ttcsid",
    host_pattern: null,
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
  {
    name: "Google Tag Manager",
    cookie_pattern: null,
    host_pattern: "(^|\\.)googletagmanager\\.com$",
  },
];

describe("naming what the store wrote", () => {
  test.each([
    ["_fbp", "Meta Pixel"],
    ["_fbc", "Meta Pixel"],
    ["_ga", "Google Analytics"],
    ["_ga_WGZPDK4DH1", "Google Analytics"],
    ["_gid", "Google Analytics"],
    ["_gcl_au", "Google Ads"],
    ["_ttp", "TikTok"],
    ["ttcsid_CJVHHJ3C77U20ERJTS3G", "TikTok"],
    ["_tt_enable_cookie", "TikTok"],
    ["_hjSessionUser_123", "Hotjar"],
  ])("%s is %s", (cookie, expected) => {
    expect(nameCookie(cookie, TRACKERS)).toBe(expected);
  });

  test.each([
    ["session_id", "the shop's own session"],
    ["cart", "the shop's own cart"],
    ["XSRF-TOKEN", "a security token"],
    ["_fbpx", "close to a pixel, and not one"],
    ["my_gid", "contains a pattern, does not start with it"],
  ])("%s has no name (%s)", (cookie) => {
    expect(nameCookie(cookie, TRACKERS)).toBeNull();
  });

  test("an unnamed cookie is null, never a guess", () => {
    // Most of what a shop writes is the shop's own. Naming those would invent
    // a fact about somebody's store, which is the one thing this cannot do.
    expect(nameCookie("whatever_this_is", TRACKERS)).toBeNull();
  });
});

describe("a pattern that does not compile", () => {
  const broken: Tracker[] = [
    { name: "Broken", cookie_pattern: "([unclosed", host_pattern: null },
    { name: "Meta Pixel", cookie_pattern: "^_fbp$", host_pattern: null },
  ];

  test("costs one name, not the whole report", () => {
    // The list is data, editable without a deploy. One bad row must not take
    // the report down with it.
    expect(nameCookie("_fbp", broken)).toBe("Meta Pixel");
    expect(nameCookie("anything", broken)).toBeNull();
  });
});

describe("naming who the store talked to", () => {
  test.each([
    ["connect.facebook.net", "Meta Pixel"],
    ["www.facebook.com", "Meta Pixel"],
    ["www.google-analytics.com", "Google Analytics"],
    ["www.googletagmanager.com", "Google Tag Manager"],
  ])("%s is %s", (host, expected) => {
    expect(nameHost(host, TRACKERS)).toBe(expected);
  });

  test.each([
    ["cdn.loja.com.br", "the shop's own CDN"],
    ["notfacebook.net", "a name that merely ends the same way"],
    ["viacep.com.br", "a service that is not a tracker"],
  ])("%s has no name (%s)", (host) => {
    expect(nameHost(host, TRACKERS)).toBeNull();
  });
});

describe("the services behind a reading", () => {
  test("are listed once each, in the order they appear", () => {
    const cookies = [
      { name: "session_id" },
      { name: "_fbp" },
      { name: "_ga" },
      { name: "_ga_ABC" },
      { name: "_ttp" },
    ];

    expect(namedTrackers({ cookies }, TRACKERS)).toEqual([
      "Meta Pixel",
      "Google Analytics",
      "TikTok",
    ]);
  });

  test("count a service seen both ways only once", () => {
    // The Meta Pixel that writes `_fbp` and calls connect.facebook.net is one
    // pixel. Counting it twice would inflate every number the report prints.
    expect(
      namedTrackers(
        {
          cookies: [{ name: "_fbp" }],
          requests: [{ host: "connect.facebook.net" }],
        },
        TRACKERS
      )
    ).toEqual(["Meta Pixel"]);
  });

  test("find the service that leaves no cookie at all", () => {
    expect(
      namedTrackers(
        { requests: [{ host: "www.googletagmanager.com" }] },
        TRACKERS
      )
    ).toEqual(["Google Tag Manager"]);
  });

  test("are empty when the store wrote only its own", () => {
    expect(
      namedTrackers({ cookies: [{ name: "cart" }, { name: "csrf" }] }, TRACKERS)
    ).toEqual([]);
  });
});
