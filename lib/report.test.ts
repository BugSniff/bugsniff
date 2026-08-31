import { describe, expect, test } from "vitest";
import { listed, reportOf, type Reported } from "./report";

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.net$",
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
  { name: "Google Analytics", cookie_pattern: "^_ga", host_pattern: null },
];

const scan = (over: Partial<Reported> = {}): Reported => ({
  url: "https://www.loja.com.br/",
  created_at: "2026-08-31T17:02:00Z",
  consent_banner: "accepted",
  policy_state: null,
  policy_url: null,
  policy_text: null,
  cookies: [],
  requests: [],
  findings: [],
  ...over,
});

describe("listed", () => {
  test("says a list the way a person says it", () => {
    expect(listed([])).toBe("");
    expect(listed(["Hotjar"])).toBe("Hotjar");
    expect(listed(["Hotjar", "Criteo"])).toBe("Hotjar e Criteo");
    expect(listed(["a", "b", "c"])).toBe("a, b e c");
  });
});

describe("reportOf", () => {
  test("counts only what happened before consent", () => {
    const report = reportOf(
      scan({
        cookies: [
          { name: "_fbp", phase: "pre-consent" },
          { name: "carrinho", phase: "pre-consent" },
          { name: "_hjSession", phase: "post-consent" },
        ],
        requests: [{ host: "connect.facebook.net", phase: "pre-consent" }],
      }),
      TRACKERS
    );

    expect(report.counts).toEqual({ cookies: 2, thirdParties: 1, trackers: 1 });
    expect(report.summary).toContain("2 cookies");
    expect(report.summary).toContain("1 endereço de terceiro");
    expect(report.summary).toContain("Meta Pixel");
  });

  test("says so plainly when nothing it can name fired", () => {
    const report = reportOf(
      scan({ cookies: [{ name: "carrinho", phase: "pre-consent" }] }),
      TRACKERS
    );

    expect(report.counts.trackers).toBe(0);
    expect(report.summary).toContain("Nenhum deles pertence");
  });

  // The banner is part of the sentence because it is what "before" means. A
  // store that asks nothing and a store whose banner we could not answer are
  // different facts, and neither is "the visitor accepted" (#32, #34).
  test("says what 'before' meant in this reading", () => {
    expect(reportOf(scan({ consent_banner: "accepted" }), TRACKERS).summary) //
      .toContain("antes de qualquer interação com o banner de consentimento");

    expect(reportOf(scan({ consent_banner: "not-found" }), TRACKERS).summary) //
      .toContain("não encontrou banner de consentimento");

    expect(reportOf(scan({ consent_banner: "unrecognised" }), TRACKERS).summary) //
      .toContain("não conseguiu responder");
  });

  describe("what the policy declares", () => {
    const withPolicy = (text: string) =>
      scan({
        cookies: [
          { name: "_fbp", phase: "pre-consent" },
          { name: "_hjSession", phase: "pre-consent" },
        ],
        policy_state: "found",
        policy_url: "https://loja.com.br/privacidade",
        policy_text: text,
      });

    test("separates what it names from what it does not", () => {
      const report = reportOf(
        withPolicy("Usamos Hotjar para entender a navegação."),
        TRACKERS
      );

      expect(report.disclosure).toBe(
        "A política de privacidade publicada foi localizada e lida. Ela cita Hotjar; não cita Meta Pixel."
      );
    });

    test("does not write a semicolon with nothing after it", () => {
      expect(
        reportOf(withPolicy("Usamos Hotjar e Meta para medir."), TRACKERS)
          .disclosure
      ).toBe(
        "A política de privacidade publicada foi localizada e lida. Ela cita Meta Pixel e Hotjar."
      );

      expect(
        reportOf(withPolicy("Não falamos de serviço nenhum."), TRACKERS)
          .disclosure
      ).toBe(
        "A política de privacidade publicada foi localizada e lida. Ela não cita Meta Pixel e Hotjar."
      );
    });

    // Not finding a policy is our browser failing to find, never the store
    // failing to publish. A report says nothing rather than blur the two.
    test("says nothing at all about a policy it never read", () => {
      expect(
        reportOf(scan({ policy_state: "not-found" }), TRACKERS).disclosure
      ).toBeNull();
      expect(
        reportOf(
          scan({ policy_state: "unreadable", policy_url: "https://x" }),
          TRACKERS
        ).disclosure
      ).toBeNull();
    });
  });
});
