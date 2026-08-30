import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { observeStore, type ObservedCookie, type Scan } from "../scan";
import { startFixtureStore, type FixtureStore } from "./fixture-store";

/**
 * Both readings happen once, in parallel, and every test asserts on them.
 *
 * Each reading costs two page loads plus the settle the scan waits out, and
 * `pnpm check` runs on every commit. Reading the two fixtures at the same time
 * is the difference between a hook that pauses and one that stalls.
 */
let store: FixtureStore;
let withBanner: Scan;
let withoutBanner: Scan;

beforeAll(async () => {
  store = await startFixtureStore();
  [withBanner, withoutBanner] = await Promise.all([
    observeStore(store.withBanner),
    observeStore(store.withoutBanner),
  ]);
}, 60_000);

afterAll(() => store?.close());

const names = (scan: Scan, phase: ObservedCookie["phase"]) =>
  scan.ok
    ? scan.cookies.filter((c) => c.phase === phase).map((c) => c.name)
    : [];

describe("a store that shows a banner", () => {
  test("is read in two states", () => {
    expect(withBanner).toMatchObject({ ok: true, consentBanner: true });
  });

  test("reports the tracker that fired before anything was asked", () => {
    expect(names(withBanner, "pre-consent")).toContain("fixture_analytics");
  });

  test("reports as post-consent only what the acceptance brought", () => {
    expect(names(withBanner, "post-consent")).toContain("fixture_pixel");
    expect(names(withBanner, "post-consent")).not.toContain(
      "fixture_analytics"
    );
  });

  test("accepts everything, not the refusal that opens with 'Aceitar'", () => {
    // "Aceitar apenas os necessários" sits first in the banner and never sets
    // the pixel. Its presence in the post-consent state is the whole check.
    expect(names(withBanner, "post-consent")).toContain("fixture_pixel");
  });
});

describe("a store that asks nothing", () => {
  test("is read as a single state, and does not fail", () => {
    expect(withoutBanner).toMatchObject({ ok: true, consentBanner: false });
  });

  test("has no post-consent state, because nothing was consented to", () => {
    expect(names(withoutBanner, "post-consent")).toEqual([]);
    expect(names(withoutBanner, "pre-consent")).toContain("fixture_analytics");
  });
});
