import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { namedTrackers, type Tracker } from "@/packages/tracker";

/** A scan, reduced to what a list of them needs. */
export type Exam = {
  id: string;
  url: string;
  status: string;
  consent_banner: ConsentBannerState | null;
  policy_state: string | null;
  policy_text?: string | null;
  cookies: { name: string; phase?: ConsentPhase }[] | null;
  requests: { host: string; phase?: ConsentPhase }[] | null;
  created_at: string;
  store_id: string | null;
};

/** A store, with what its readings add up to. */
export type StoreSummary = {
  id: string;
  host: string;
  /** How many readings there are. A store always has at least one. */
  exams: number;
  /** The most recent one, which is what a list of stores is really showing. */
  latest: Exam;
};

/**
 * Which services fired in one reading of the store, in one of its two states.
 *
 * Counted at read time from the tracker table rather than stored on the scan,
 * so a service named in the table today names the cookies of a reading taken
 * last week — which is the whole point of keeping that list as data.
 */
export function trackersIn(
  exam: Exam,
  phase: ConsentPhase,
  trackers: readonly Tracker[]
): string[] {
  if (exam.status !== "done") return [];

  return namedTrackers(
    {
      cookies: (exam.cookies ?? []).filter((c) => c.phase === phase),
      requests: (exam.requests ?? []).filter((r) => r.phase === phase),
    },
    trackers
  );
}

/**
 * Groups readings under the stores they are readings of.
 *
 * `exams` has to arrive newest first — the first one seen for a store is the
 * one the list shows. A store with no reading at all cannot happen: a store is
 * created by the scan that first names it, so one with none is a row we failed
 * to clean up, and it is dropped rather than shown as a store nothing is known
 * about.
 */
export function summarise(
  stores: readonly { id: string; host: string }[],
  exams: readonly Exam[]
): StoreSummary[] {
  const byStore = new Map<string, Exam[]>();
  for (const exam of exams) {
    if (!exam.store_id) continue;
    const list = byStore.get(exam.store_id);
    if (list) list.push(exam);
    else byStore.set(exam.store_id, [exam]);
  }

  return stores
    .map(({ id, host }) => {
      const own = byStore.get(id) ?? [];
      return own.length > 0
        ? { id, host, exams: own.length, latest: own[0] }
        : null;
    })
    .filter((store): store is StoreSummary => store !== null)
    .sort(
      (a, b) =>
        Date.parse(b.latest.created_at) - Date.parse(a.latest.created_at)
    );
}
