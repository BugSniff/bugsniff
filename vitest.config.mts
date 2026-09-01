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
  test: {
    /**
     * One test file at a time, because three of them drive real browsers.
     *
     * Each of those opens several Chromium instances at once, on purpose — it
     * is what keeps a suite of twenty page loads under a minute. Two such files
     * running side by side put a dozen browsers on one laptop, and what fails
     * then is not the code: a store that answers in 3s answers in 25s, the
     * navigation budget runs out, and the scan reports the fixture as
     * unreachable. A pre-commit gate that fails for that reason teaches people
     * to rerun it until it passes, which is the same as not having one.
     *
     * The cost is about fifteen seconds on a full run. The files that do not
     * touch a browser take a second between them all.
     */
    fileParallelism: false,
  },
});
