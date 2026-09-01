import { describe, expect, test } from "vitest";
import { evidenceOf, orphansAmong } from "../index";

/**
 * The two decisions that stand between a cleanup and an incident.
 *
 * Both are pure, and both are here because of the blast radius rather than the
 * complexity. `orphansAmong` inverted deletes the screenshots of every scan
 * that *does* exist — every live reading in the product, in one pass, with no
 * way back. `evidenceOf` is what keeps a stray entry from either being deleted
 * or, as actually happened, poisoning the lookup so that a whole sweep reported
 * zeros and did nothing for as long as nobody looked.
 */

const A = "0e4b7d0a-0000-4000-8000-000000000001";
const B = "0e4b7d0a-0000-4000-8000-000000000002";

describe("what in the bucket is evidence of ours", () => {
  test("reads a folder as the scan it is named after", () => {
    expect(evidenceOf([A, B]).scans).toEqual([A, B]);
  });

  test("reads the flat layout that came before folders", () => {
    // `<scan>.jpg`, left behind by the move to two readings per scan.
    const { scans, flat } = evidenceOf([`${A}.jpg`]);

    expect(scans).toEqual([A]);
    expect(flat.get(A)).toBe(`${A}.jpg`);
  });

  test("counts a scan once when it has both layouts", () => {
    expect(evidenceOf([A, `${A}.jpg`]).scans).toEqual([A]);
  });

  test("leaves alone anything that is not evidence of ours", () => {
    // Supabase writes the placeholder itself, and a bucket collects whatever
    // somebody uploads by hand. Neither is ours to delete.
    const { scans, ignored } = evidenceOf([
      ".emptyFolderPlaceholder",
      "logo.png",
      A,
    ]);

    expect(scans).toEqual([A]);
    expect(ignored).toEqual([".emptyFolderPlaceholder", "logo.png"]);
  });

  test("keeps a stray entry out of the scan list entirely", () => {
    // The failure this filter was written for: a name that is not a uuid makes
    // `id in (...)` fail with `invalid input syntax for type uuid`, and the
    // sweep then reports zeros — indistinguishable from nothing to do.
    expect(evidenceOf([".emptyFolderPlaceholder"]).scans).toEqual([]);
  });
});

describe("which scans are gone", () => {
  test("keeps every scan that is still there", () => {
    expect(orphansAmong([A, B], [A, B])).toEqual([]);
  });

  test("names the one that is not", () => {
    expect(orphansAmong([A, B], [B])).toEqual([A]);
  });

  test("names all of them when the bucket outlived every scan", () => {
    // The state the product was found in: 17 objects, not one matching scan.
    expect(orphansAmong([A, B], [])).toEqual([A, B]);
  });

  test("finds nothing to do in an empty bucket", () => {
    expect(orphansAmong([], [A])).toEqual([]);
  });

  test("never invents evidence for a scan that has none", () => {
    // A scan whose upload failed has a row and no folder. The answer is about
    // what is in the bucket, and only about that.
    expect(orphansAmong([A], [A, B])).toEqual([]);
  });
});
