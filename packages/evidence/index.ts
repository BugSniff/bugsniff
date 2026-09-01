import type { ConsentPhase } from "../scan/scan";
import type { createAdminClient } from "../supabase/admin";

/**
 * Where the screenshots live, and what happens to them when the scan is gone.
 *
 * They are the one thing about a scan that no cascade reaches. Everything else
 * is a row with a foreign key — a store dies with its organization, a scan with
 * either, a consent banner with its store — and these are objects in a bucket,
 * which the database cannot delete: Supabase blocks direct deletion from
 * `storage.objects` outright (`protect_objects_delete`), precisely so nobody
 * removes the row and leaves the byte behind. So the cascade has to live here,
 * where the storage API is reachable.
 *
 * Why it matters more than disk: these are photographs of somebody's
 * storefront, taken by our browser for an audit whose record has been deleted.
 * Story 52 of the spec is "quero excluir minha conta e meus dados, para exercer
 * o direito de eliminação que a ferramenta cobra dos outros" — a product that
 * keeps the pictures after deleting the account fails the single demand it
 * makes of everybody else.
 */

type Admin = ReturnType<typeof createAdminClient>;

/** The bucket. Named in one place, so no screen can drift to another. */
export const EVIDENCE_BUCKET = "scan-evidence";

/**
 * How many entries one sweep looks at.
 *
 * A page, not everything. The sweep runs daily and sits behind a function's
 * duration budget; whatever it does not reach today it reaches tomorrow, and a
 * bounded pass that always finishes beats an unbounded one that sometimes dies
 * halfway with the deletion half done.
 */
const PER_SWEEP = 1000;

/** What one sweep did, and why it did not do more. */
export type Swept = {
  /** Scans whose evidence this pass looked at. */
  scans: number;
  /** The ones whose scan no longer exists. */
  orphans: string[];
  /** Objects actually deleted. Always 0 on a dry run. */
  removed: number;
  /** Entries in the bucket that are no evidence of ours, left untouched. */
  ignored: string[];
  /** Present when the sweep gave up, with the reason. */
  halted?: string;
};

const NOTHING = { scans: 0, orphans: [], removed: 0, ignored: [] };

/**
 * Files a screenshot under the scan that produced it.
 *
 * Foldered by scan on purpose: the storage policy resolves the folder back to
 * the row, so a picture is readable by exactly the people the reading is — and
 * the same folder is what makes the deletion below a single, obvious unit.
 */
export async function storeEvidence(
  supabase: Admin,
  scanId: string,
  reading: ConsentPhase | "blocked",
  evidence: Buffer | null
): Promise<string | null> {
  if (!evidence) return null;

  const path = `${scanId}/${reading}.jpg`;

  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, evidence, { contentType: "image/jpeg", upsert: true });

  // A scan without its screenshot is still a scan. Losing the picture is not
  // worth losing the reading it illustrates.
  return error ? null : path;
}

/** A uuid, and therefore the name of a scan. */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * A folder named after a scan: `<scan>/<reading>.jpg`, the layout in use.
 *
 * The filter is not tidiness. The bucket holds things we did not put there —
 * Supabase writes a `.emptyFolderPlaceholder` of its own, and a bucket lives
 * long enough to collect whatever somebody uploads by hand — and an entry that
 * is not a uuid makes the `id in (...)` lookup below fail outright with
 * `invalid input syntax for type uuid`. One such entry took an entire sweep
 * down with it, silently, which is how this filter came to exist.
 *
 * The other reason is simpler: a name that is not a scan's is not ours to
 * delete.
 */
const SCAN_FOLDER = new RegExp(`^${UUID}$`, "i");

/**
 * And the flat layout that came before it: `<scan>.jpg`, no folder.
 *
 * Left behind by the move to two readings per scan. That migration said as much
 * at the time — "the objects themselves are the same storage-cleanup debt the
 * bucket already carries" — and this is the sweep paying it. Two of them were
 * still in the bucket when this module was written.
 */
const FLAT_EVIDENCE = new RegExp(`^(${UUID})\\.jpg$`, "i");

/** The scans these bucket entries hold evidence of, whichever layout. */
export function evidenceOf(names: readonly string[]): {
  scans: string[];
  /** The path of each flat object, which is not derivable from its scan id. */
  flat: Map<string, string>;
  /** Everything in the bucket that is not evidence of ours. */
  ignored: string[];
} {
  const scans = new Set<string>();
  const flat = new Map<string, string>();
  const ignored: string[] = [];

  for (const name of names) {
    const asFlat = name.match(FLAT_EVIDENCE);

    if (SCAN_FOLDER.test(name)) {
      scans.add(name.toLowerCase());
    } else if (asFlat) {
      scans.add(asFlat[1].toLowerCase());
      flat.set(asFlat[1].toLowerCase(), name);
    } else {
      ignored.push(name);
    }
  }

  return { scans: [...scans], flat, ignored };
}

/**
 * Which of these scans are gone.
 *
 * A pure function with a test, for a filter whose inversion would delete the
 * evidence of every *live* scan instead. It is one character away from being a
 * catastrophe, and that is reason enough for it to be a named thing rather than
 * a condition inside a loop.
 */
export function orphansAmong(
  scans: readonly string[],
  liveScanIds: readonly string[]
): string[] {
  const live = new Set(liveScanIds.map((id) => id.toLowerCase()));
  return scans.filter((scan) => !live.has(scan));
}

/** Every object belonging to these scans, in either layout. */
async function pathsFor(
  supabase: Admin,
  scanIds: readonly string[],
  flat: Map<string, string> = new Map()
): Promise<string[]> {
  const paths: string[] = [];

  for (const scanId of scanIds) {
    const own = flat.get(scanId);
    if (own) paths.push(own);

    const { data } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .list(scanId, { limit: 100 });

    for (const file of data ?? []) paths.push(`${scanId}/${file.name}`);
  }

  return paths;
}

/**
 * Deletes the screenshots of scans that no longer exist.
 *
 * The sweep exists because the deletion is not ours to observe. What deletes
 * scans today is a daily `pg_cron` job on `auth.users`, cascading through the
 * organization and the store without a line of our code running — there is no
 * moment at which the app could react. So it reads the bucket, asks the
 * database which of those scans are still there, and removes the rest.
 *
 * It is also the cascade on demand. A screen that deletes an exam or an
 * organization calls this straight after deleting the row: the row is gone, so
 * its pictures are orphans, so they go in the same request. One code path for
 * both, rather than a second function that does the same thing to a narrower
 * list and gets tested half as much.
 */
export async function sweepOrphanEvidence(
  supabase: Admin,
  /**
   * Report what would go, and delete nothing.
   *
   * A scheduled job that deletes is a job somebody has to be able to inspect
   * before trusting it, and again afterwards when the numbers look wrong.
   * Without this, the only way to learn what the sweep calls an orphan is to
   * let it remove them.
   */
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<Swept> {
  const { data: entries, error: listing } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .list("", { limit: PER_SWEEP });

  if (listing || !entries) {
    return { ...NOTHING, halted: listing?.message ?? "bucket ilegível" };
  }

  const { scans, flat, ignored } = evidenceOf(entries.map(({ name }) => name));

  if (scans.length === 0) return { ...NOTHING, ignored };

  const { data: live, error } = await supabase
    .from("scans")
    .select("id")
    .in("id", scans);

  // The line that decides whether this is a cleanup or an incident. A failed
  // query returns no rows, and no rows read as "not one of these scans exists"
  // — which would delete the evidence of every scan in the bucket. So an error
  // is not an empty answer: it is a reason to do nothing.
  //
  // And it says why. Reporting zeros for a sweep that never got to ask the
  // question is indistinguishable from a sweep with nothing to do, which is how
  // a broken cleanup runs unnoticed for a month.
  if (error || !live) {
    return {
      scans: scans.length,
      orphans: [],
      removed: 0,
      ignored,
      halted: error?.message ?? "exames ilegíveis",
    };
  }

  const orphans = orphansAmong(
    scans,
    live.map(({ id }) => id as string)
  );

  if (dryRun) return { scans: scans.length, orphans, removed: 0, ignored };

  const paths = await pathsFor(supabase, orphans, flat);

  const { error: removing } = paths.length
    ? await supabase.storage.from(EVIDENCE_BUCKET).remove(paths)
    : { error: null };

  return {
    scans: scans.length,
    orphans,
    removed: removing ? 0 : paths.length,
    ignored,
    ...(removing ? { halted: removing.message } : {}),
  };
}
