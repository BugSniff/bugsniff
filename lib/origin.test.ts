import { describe, expect, test } from "vitest";
import { originFrom } from "./origin";

const head = (values: Record<string, string>) => ({
  get: (name: string) => values[name] ?? null,
});

describe("originFrom", () => {
  test("production, behind the proxy", () => {
    expect(
      originFrom(
        head({
          host: "bugsniff-lx8i7ropj.vercel.app",
          "x-forwarded-host": "www.bugsniff.com.br",
          "x-forwarded-proto": "https",
        })
      )
    ).toBe("https://www.bugsniff.com.br");
  });

  /**
   * The name the visitor typed, not the deployment's own. A preview that
   * handed the queue back to `bugsniff.vercel.app` would be a preview running
   * its scans somewhere else.
   */
  test("prefers the forwarded host over the deployment's", () => {
    expect(
      originFrom(
        head({ host: "internal", "x-forwarded-host": "preview.vercel.app" })
      )
    ).toBe("https://preview.vercel.app");
  });

  test("a laptop is http, and is recognised rather than assumed", () => {
    expect(originFrom(head({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000"
    );
    expect(originFrom(head({ host: "127.0.0.1:3000" }))).toBe(
      "http://127.0.0.1:3000"
    );
  });

  test("anything else without a scheme header is https", () => {
    expect(originFrom(head({ host: "www.bugsniff.com.br" }))).toBe(
      "https://www.bugsniff.com.br"
    );
  });

  /**
   * The header this module exists to not read. A request carrying `Origin` is
   * fine — it is simply not where the answer comes from, because the requests
   * that matter here do not carry it.
   */
  test("ignores Origin, which a page render never has", () => {
    expect(
      originFrom(
        head({
          origin: "https://attacker.example",
          host: "www.bugsniff.com.br",
        })
      )
    ).toBe("https://www.bugsniff.com.br");
  });
});
