import type { NextConfig } from "next";

/**
 * The routes that launch a browser, and therefore need its binaries shipped.
 *
 * These keys follow the code. The first used to be `/`, back when pasting a URL
 * ran the browser during the page render; the worker owns that now. Point one
 * at a route that no longer opens Chromium — or add a route that does and
 * forget to list it here — and the build still passes. The failure only shows
 * up in production, as "cannot find module".
 *
 * Every caller of `packages/scan/browser.ts` belongs in this list.
 */
const BROWSER_ROUTES = ["/api/scan-worker", "/api/exame/[id]/relatorio"];

const CHROMIUM = [
  "./node_modules/@sparticuz/chromium/bin/**",
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/lib/**",
];

const nextConfig: NextConfig = {
  // Both packages find their binaries by walking relative paths at runtime.
  // Bundling rewrites those paths and breaks the lookup, so they stay external.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],

  // Marking them external is NOT enough, and this is the part that fails
  // silently (ADR-0002). Next's file tracing follows JavaScript imports, and
  // these are data files nothing imports: Chromium's brotli archives and
  // Playwright's browsers.json. They are dropped from the deployment without a
  // word during build, and the function dies in production with "cannot find
  // module".
  //
  // Vercel's `includeFiles` documentation does not apply to Next projects.
  // These have to be forced here, keyed by the route that needs them.
  outputFileTracingIncludes: Object.fromEntries(
    BROWSER_ROUTES.map((route) => [route, CHROMIUM])
  ),
};

export default nextConfig;
