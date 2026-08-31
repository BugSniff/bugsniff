import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The `@/` alias, so a test can import what the code it tests imports.
 *
 * `tsconfig.json` maps it for the compiler and Next maps it for the bundler;
 * vitest was the one place that did not, which made a module reachable from
 * the app but not from a test — a quiet reason to stop writing the test.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
