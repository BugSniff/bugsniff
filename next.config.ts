import type { NextConfig } from "next";

/**
 * The route that launches a browser, and therefore needs its binaries shipped.
 *
 * This key follows the scan. It used to be `/`, back when pasting a URL ran the
 * browser during the page render; the worker owns that now. Point it at a route
 * that no longer opens Chromium and the build still passes — the failure only
 * shows up in production, as "cannot find module".
 */
const SCAN_ROUTE = "/api/scan-worker";

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
  outputFileTracingIncludes: {
    [SCAN_ROUTE]: [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/playwright-core/lib/**",
    ],
  },
};

export default nextConfig;
