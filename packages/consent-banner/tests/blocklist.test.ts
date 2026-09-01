import { describe, expect, test } from "vitest";
import {
  blocklistFrom,
  purposesIn,
  type PurposefulTracker,
} from "../blocklist";

/**
 * What ends up on the list, and — mostly — what does not.
 *
 * The list is the product's promise that the banner blocks the store's own
 * trackers and not a guess: everything here is a way of getting that wrong.
 * Blocking a service the reading never saw would be inventing a fact about the
 * shop; blocking the shop's own plumbing would take the shop down; blocking a
 * third party we cannot name would take it down on a guess.
 */

const TRACKERS: PurposefulTracker[] = [
  {
    name: "Meta Pixel",
    purpose: "marketing",
    cookie_pattern: "^_fbp$",
    host_pattern: "(^|\\.)facebook\\.net$",
  },
  {
    name: "Google Analytics",
    purpose: "analytics",
    cookie_pattern: "^_ga",
    host_pattern: "(^|\\.)google-analytics\\.com$",
  },
  {
    name: "Google Fonts",
    purpose: "essential",
    cookie_pattern: null,
    host_pattern: "(^|\\.)fonts\\.gstatic\\.com$",
  },
  {
    name: "TikTok",
    purpose: "marketing",
    cookie_pattern: "^_ttp$",
    host_pattern: "(^|\\.)tiktok\\.com$",
  },
];

const names = (list: { blocked: { name: string }[] }) =>
  list.blocked.map(({ name }) => name);

describe("what the banner holds back", () => {
  test("is what this reading found, and nothing else in the table", () => {
    const list = blocklistFrom(
      { cookies: [{ name: "_fbp" }], requests: [] },
      TRACKERS
    );

    expect(names(list)).toEqual(["Meta Pixel"]);
    // TikTok is in the table and was not in the shop. A blocklist that held it
    // anyway would be a statement about this store that the reading does not
    // support — and the merchant, comparing it against their report, would find
    // a service the audit never named.
    expect(names(list)).not.toContain("TikTok");
  });

  test("counts a service seen twice as one service", () => {
    const list = blocklistFrom(
      {
        cookies: [{ name: "_fbp" }],
        requests: [{ host: "connect.facebook.net" }],
      },
      TRACKERS
    );

    expect(names(list)).toEqual(["Meta Pixel"]);
  });

  test("carries the patterns that named it, so the banner blocks both halves", () => {
    const list = blocklistFrom(
      { requests: [{ host: "connect.facebook.net" }] },
      TRACKERS
    );

    // The cookie pattern travels even though this reading only saw the request:
    // the same service writes `_fbp` on the next page, and the banner has to
    // hold the service, not the one shape of it we happened to observe.
    expect(list.blocked[0]).toMatchObject({
      name: "Meta Pixel",
      purpose: "marketing",
      cookie: "^_fbp$",
      host: "(^|\\.)facebook\\.net$",
    });
  });

  test("never includes the store's own plumbing", () => {
    const list = blocklistFrom(
      { requests: [{ host: "fonts.gstatic.com" }] },
      TRACKERS
    );

    expect(names(list)).toEqual([]);
    // Named, found, and reported as let through. Silence here would read as a
    // service we failed to notice.
    expect(list.essential).toEqual(["Google Fonts"]);
  });

  test("never includes a third party we could not name", () => {
    const list = blocklistFrom(
      {
        requests: [
          { host: "track.titanpush.com" },
          { host: "cdn.titanpush.com" },
          { host: "connect.facebook.net" },
        ],
      },
      TRACKERS
    );

    expect(names(list)).toEqual(["Meta Pixel"]);
    // By who they are, not by how many addresses they answer on.
    expect(list.unnamed).toEqual(["titanpush.com"]);
  });

  test("is empty for a reading that found nothing", () => {
    expect(blocklistFrom({}, TRACKERS)).toEqual({
      blocked: [],
      essential: [],
      unnamed: [],
    });
  });
});

describe("the choices the panel offers", () => {
  test("are the purposes this store actually has", () => {
    const list = blocklistFrom({ cookies: [{ name: "_ga" }] }, TRACKERS);

    // A shop that runs no advertising is not asked about advertising. The
    // alternative is a form invented to look thorough.
    expect(purposesIn(list)).toEqual(["analytics"]);
  });

  test("are both, in a fixed order, when the store has both", () => {
    const list = blocklistFrom(
      { cookies: [{ name: "_fbp" }, { name: "_ga" }] },
      TRACKERS
    );

    expect(purposesIn(list)).toEqual(["analytics", "marketing"]);
  });

  test("are none at all when there is nothing to hold", () => {
    expect(purposesIn(blocklistFrom({}, TRACKERS))).toEqual([]);
  });
});
