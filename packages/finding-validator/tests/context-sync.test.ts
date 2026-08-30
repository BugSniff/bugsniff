import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { FORBIDDEN_TERMS } from "../index";

/**
 * CONTEXT.md is the canonical home of the forbidden vocabulary. If the two ever
 * drift, the glossary becomes a document that describes a product that does not
 * exist — so this fails loudly instead.
 */
test("the code list matches the list in CONTEXT.md", () => {
  const context = readFileSync(
    new URL("../../../CONTEXT.md", import.meta.url),
    "utf8"
  );
  const line = context
    .split("\n")
    .find((l) => l.includes(" · ") && l.includes("irregular"));

  expect(line, "no ' · ' separated list found in CONTEXT.md").toBeDefined();

  const fromDoc = line!.split("·").map((t) => t.trim());
  expect(fromDoc).toEqual([...FORBIDDEN_TERMS]);
});
