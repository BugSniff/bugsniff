import { describe, expect, test } from "vitest";
import {
  failureMessage,
  failureShort,
  summarise,
  trackersIn,
  type Exam,
} from "./exams";

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.net$",
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
];

const exam = (over: Partial<Exam> = {}): Exam => ({
  id: "a",
  url: "https://loja.com.br/",
  status: "done",
  consent_banner: "accepted",
  policy_state: "found",
  cookies: [],
  requests: [],
  created_at: "2026-08-31T12:00:00Z",
  store_id: "s1",
  ...over,
});

describe("trackersIn", () => {
  test("counts a service once, however many ways it showed up", () => {
    const found = trackersIn(
      exam({
        cookies: [{ name: "_fbp", phase: "pre-consent" }],
        requests: [{ host: "connect.facebook.net", phase: "pre-consent" }],
      }),
      "pre-consent",
      TRACKERS
    );

    expect(found).toEqual(["Meta Pixel"]);
  });

  test("keeps the two states apart", () => {
    const reading = exam({
      cookies: [
        { name: "_fbp", phase: "pre-consent" },
        { name: "_hjSession", phase: "post-consent" },
      ],
    });

    expect(trackersIn(reading, "pre-consent", TRACKERS)).toEqual([
      "Meta Pixel",
    ]);
    expect(trackersIn(reading, "post-consent", TRACKERS)).toEqual(["Hotjar"]);
  });

  // A scan that did not finish has nothing to count, and "nenhum rastreador"
  // about a page that was never the store is the most flattering possible way
  // to be wrong (#34).
  test("counts nothing on a reading that did not happen", () => {
    const failed = exam({
      status: "failed",
      cookies: [{ name: "_fbp", phase: "pre-consent" }],
    });

    expect(trackersIn(failed, "pre-consent", TRACKERS)).toEqual([]);
  });
});

describe("summarise", () => {
  const stores = [
    { id: "s1", host: "loja.com.br" },
    { id: "s2", host: "outra.com.br" },
  ];

  test("shows the newest reading of each store, and counts the rest", () => {
    const summary = summarise(stores, [
      exam({ id: "novo", created_at: "2026-08-31T12:00:00Z" }),
      exam({ id: "velho", created_at: "2026-08-20T12:00:00Z" }),
      exam({ id: "outro", store_id: "s2", created_at: "2026-08-25T12:00:00Z" }),
    ]);

    expect(summary.map((s) => [s.host, s.exams, s.latest.id])).toEqual([
      ["loja.com.br", 2, "novo"],
      ["outra.com.br", 1, "outro"],
    ]);
  });

  test("drops a store with no reading rather than showing an empty one", () => {
    expect(summarise(stores, [exam({ store_id: "s1" })]).map((s) => s.host)) //
      .toEqual(["loja.com.br"]);
  });

  test("ignores a scan that belongs to no store", () => {
    expect(summarise(stores, [exam({ store_id: null })])).toEqual([]);
  });
});

describe("failureMessage", () => {
  /**
   * `FAILURES` is keyed by loose strings, because the queue writes into it too
   * and its keys are not `ScanRejection`. That is deliberate, and it is also
   * why a mistyped key is invisible: it falls through to the generic sentence
   * and the screen reads "o exame não pôde ser concluído" about a failure we
   * had a real explanation for.
   */
  test("names our own browser rather than blaming the store", () => {
    const message = failureMessage("browser-unavailable");

    expect(message).toContain("Nosso navegador não subiu");
    expect(message).not.toBe(failureMessage("qualquer-outra-coisa"));
  });

  test("falls back to a sentence rather than to nothing", () => {
    expect(failureMessage(null)).toBe("O exame não pôde ser concluído.");
  });

  test("the short form is the first clause of the whole one", () => {
    expect(failureShort("browser-unavailable")).toBe(
      "Nosso navegador não subiu, então a loja não chegou a ser aberta"
    );
  });
});
