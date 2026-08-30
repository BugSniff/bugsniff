import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  observeStore,
  type ObservedCookie,
  type PreConsentReading,
  type Scan,
} from "../scan";
import { startFixtureStore, type FixtureStore } from "./fixture-store";

/**
 * Every shape is read once, in parallel, and the tests assert on the results.
 *
 * Each reading costs a page load plus the settle the scan waits out, and
 * `pnpm check` runs on every commit. Reading the fixtures at the same time is
 * the difference between a hook that pauses and one that stalls.
 */
let store: FixtureStore;
const scans: Record<string, Scan> = {};

/** What the scan handed over before it went looking for the banner. */
const handedOver: PreConsentReading[] = [];

beforeAll(async () => {
  store = await startFixtureStore();
  const shapes = [
    ["withBanner", store.withBanner],
    ["homemade", store.homemade],
    ["inIframe", store.inIframe],
    ["unclickable", store.unclickable],
    ["withoutBanner", store.withoutBanner],
    ["refusing", store.refusing],
  ] as const;

  const results = await Promise.all(
    shapes.map(([name, url]) =>
      observeStore(
        url,
        name === "withBanner"
          ? async (reading) => {
              handedOver.push(reading);
            }
          : undefined
      )
    )
  );
  shapes.forEach(([name], index) => (scans[name] = results[index]));
}, 120_000);

afterAll(() => store?.close());

const names = (scan: Scan, phase: ObservedCookie["phase"]) =>
  scan.ok
    ? scan.cookies.filter((c) => c.phase === phase).map((c) => c.name)
    : [];

const hosts = (scan: Scan, phase: ObservedCookie["phase"]) =>
  scan.ok
    ? scan.requests.filter((r) => r.phase === phase).map((r) => r.host)
    : [];

describe("a banner with real buttons", () => {
  test("is accepted, and the store is read in two states", () => {
    expect(scans.withBanner).toMatchObject({
      ok: true,
      consentBanner: "accepted",
    });
  });

  test("reports the tracker that fired before anything was asked", () => {
    expect(names(scans.withBanner, "pre-consent")).toContain(
      "fixture_analytics"
    );
  });

  test("reports as post-consent only what the acceptance brought", () => {
    expect(names(scans.withBanner, "post-consent")).toContain("fixture_pixel");
    expect(names(scans.withBanner, "post-consent")).not.toContain(
      "fixture_analytics"
    );
  });

  test("accepts everything, not the refusal that opens with 'Aceitar'", () => {
    // "Aceitar apenas os necessários" sits first in the banner and never sets
    // the pixel. Its presence in the post-consent state is the whole check.
    expect(names(scans.withBanner, "post-consent")).toContain("fixture_pixel");
  });
});

describe("a homemade banner, with no vendor and no button element", () => {
  test("is found by its shape and accepted", () => {
    expect(scans.homemade).toMatchObject({
      ok: true,
      consentBanner: "accepted",
    });
    expect(names(scans.homemade, "post-consent")).toContain("fixture_pixel");
  });
});

describe("a banner inside an iframe", () => {
  test("is found there and accepted", () => {
    expect(scans.inIframe).toMatchObject({
      ok: true,
      consentBanner: "accepted",
    });
    expect(names(scans.inIframe, "post-consent")).toContain("fixture_pixel");
  });
});

describe("a banner the scan cannot answer", () => {
  test("is reported as unrecognised, never as a store that asks nothing", () => {
    expect(scans.unclickable).toMatchObject({
      ok: true,
      consentBanner: "unrecognised",
    });
  });

  test("names the platform whose trace is on the page", () => {
    expect(scans.unclickable).toMatchObject({ consentPlatform: "IAB TCF" });
  });

  test("keeps a screenshot, because only a picture confirms this", () => {
    expect(
      scans.unclickable.ok && scans.unclickable.evidence.preConsent?.length
    ).toBeGreaterThan(0);
  });

  test("never clicks the footer link that opens with an accepting word", () => {
    // "Aceito os termos de uso" lives in the footer, which is not fixed and
    // therefore not a banner. Clicking it would record a consent nobody gave.
    expect(names(scans.unclickable, "post-consent")).toEqual([]);
  });
});

describe("a store that asks nothing", () => {
  test("is read as a single state, and does not fail", () => {
    expect(scans.withoutBanner).toMatchObject({
      ok: true,
      consentBanner: "not-found",
      consentPlatform: null,
    });
  });

  test("has no post-consent state, because nothing was consented to", () => {
    expect(names(scans.withoutBanner, "post-consent")).toEqual([]);
    expect(names(scans.withoutBanner, "pre-consent")).toContain(
      "fixture_analytics"
    );
  });

  test("keeps a screenshot, because this is the strongest claim we make", () => {
    expect(
      scans.withoutBanner.ok && scans.withoutBanner.evidence.preConsent?.length
    ).toBeGreaterThan(0);
  });
});

describe("the first half of the reading", () => {
  test("is handed over before the banner is answered", () => {
    // Not a detail of implementation: this hand-over is what puts a real
    // result on the screen at five seconds instead of at twenty-five.
    expect(handedOver).toHaveLength(1);
    expect(handedOver[0].cookies.map((c) => c.name)).toContain(
      "fixture_analytics"
    );
  });

  test("carries the third parties reached before any interaction", () => {
    expect(handedOver[0].requests.map((r) => r.host)).toContain(
      "pixel-before.example"
    );
  });

  test("carries only what was true before any interaction", () => {
    expect(handedOver[0].cookies.every((c) => c.phase === "pre-consent")).toBe(
      true
    );
    expect(handedOver[0].cookies.map((c) => c.name)).not.toContain(
      "fixture_pixel"
    );
  });

  test("comes with the store's screen as it stood then", () => {
    expect(handedOver[0].evidence?.length).toBeGreaterThan(0);
  });
});

describe("a store read all the way through", () => {
  test("keeps a screen from each reading", () => {
    const scan = scans.withBanner;
    expect(scan.ok && scan.evidence.preConsent?.length).toBeGreaterThan(0);
    expect(scan.ok && scan.evidence.postConsent?.length).toBeGreaterThan(0);
  });
});

describe("a store that refuses our browser", () => {
  test("is not a reading, and does not pretend to be one", () => {
    // The refusal page has a title, a body and a cookie of its own. Reported as
    // a scan, it would be a store with nothing to hide — which is the most
    // flattering possible way to be wrong about somebody.
    expect(scans.refusing).toMatchObject({ ok: false, reason: "blocked" });
  });

  test("keeps the screen that came instead of the store", () => {
    expect(
      !scans.refusing.ok && scans.refusing.evidence?.length
    ).toBeGreaterThan(0);
  });
});

describe("a third party that writes no cookie at all", () => {
  test("is seen before consent, where it would have been invisible", () => {
    // A pixel fired by image leaves nothing behind. Until requests were
    // observed, a store doing only this came back with an empty table.
    expect(hosts(scans.withBanner, "pre-consent")).toContain(
      "pixel-before.example"
    );
  });

  test("is placed in the reading it belongs to", () => {
    expect(hosts(scans.withBanner, "post-consent")).toContain(
      "pixel-after.example"
    );
    expect(hosts(scans.withBanner, "post-consent")).not.toContain(
      "pixel-before.example"
    );
  });

  test("has no post-consent half in a store that asks nothing", () => {
    expect(hosts(scans.withoutBanner, "pre-consent")).toContain(
      "pixel-before.example"
    );
    expect(hosts(scans.withoutBanner, "post-consent")).toEqual([]);
  });

  test("never includes the store's own host", () => {
    const own = scans.withBanner.ok
      ? scans.withBanner.requests.filter((r) => r.host === "127.0.0.1")
      : [];
    expect(own).toEqual([]);
  });
});

describe("what the store says it does", () => {
  test("is found through the link the store publishes", () => {
    expect(scans.withBanner).toMatchObject({
      ok: true,
      policy: { state: "found" },
    });
  });

  test("is kept as text, without the navigation around it", () => {
    const policy = scans.withBanner.ok ? scans.withBanner.policy : null;
    expect(policy?.state === "found" && policy.text).toContain(
      "tratamos dados pessoais"
    );
    // The page carries a nav, a header and a footer with a CNPJ in it. None of
    // that is the policy, and a finding that quoted it would be quoting the
    // shop's phone number as if it were a commitment.
    expect(policy?.state === "found" && policy.text).not.toContain("Carrinho");
    expect(policy?.state === "found" && policy.text).not.toContain("CNPJ");
  });

  test("is not-found when the store links to none", () => {
    // Which is not the same as a store without a policy — and the difference
    // is the whole reason this state has a name of its own.
    expect(scans.withoutBanner).toMatchObject({
      ok: true,
      policy: { state: "not-found" },
    });
  });
});
