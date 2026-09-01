import { registrableDomain } from "../scan/third-party";
import { matchedTrackers, nameHost, type Tracker } from "../tracker/index";

/**
 * Why a service is on the page. Mirrors `trackers.purpose` in the database.
 *
 * `essential` is the shop's own plumbing and is never blocked; the other two
 * are the choices a visitor gets to answer. Three is not a taxonomy of
 * advertising — it is the most a preferences panel can ask without becoming a
 * form nobody finishes.
 */
export type TrackerPurpose = "essential" | "analytics" | "marketing";

/** The purposes consent decides. Everything else fires either way. */
export type BlockablePurpose = Exclude<TrackerPurpose, "essential">;

export const BLOCKABLE_PURPOSES: readonly BlockablePurpose[] = [
  "analytics",
  "marketing",
];

/** A tracker row as the blocklist needs it: how to recognise it, and what for. */
export type PurposefulTracker = Tracker & { purpose: TrackerPurpose };

/**
 * One service the banner holds back until it is answered.
 *
 * The patterns travel by value into the generated code, and they are the same
 * expressions the audit used to name the service in the first place. That is
 * the point of deriving the list rather than writing one: whatever the report
 * called "Meta Pixel" is exactly what the banner blocks, so the person reading
 * both is reading about one thing.
 */
export type Blocked = {
  name: string;
  purpose: BlockablePurpose;
  /** A regular expression over a cookie's name, when the service writes one. */
  cookie: string | null;
  /** A regular expression over a third-party host, when it talks to one. */
  host: string | null;
};

export type Blocklist = {
  blocked: Blocked[];
  /** Named, found, and deliberately let through: the shop's own plumbing. */
  essential: string[];
  /**
   * Third parties this reading saw and we could not put a name to.
   *
   * Reported and never blocked, and the two halves of that are equally
   * deliberate. A host we cannot name might be the payment gateway, the
   * platform's own CDN or the shipping quote — blocking those breaks the shop
   * for a guess. Hiding them instead would let our own gap read as a complete
   * list, which is the one thing the audit may never do.
   */
  unnamed: string[];
};

/** A reading of the store, as far as a blocklist is concerned. */
export type Reading = {
  cookies?: readonly { name: string }[];
  requests?: readonly { host: string }[];
};

/**
 * The services this store was seen using, sorted into what the banner may hold.
 *
 * Pass the whole reading, both states. A tracker that only fired after the
 * visitor accepted is a store already behaving, and blocking it changes nothing
 * for that visitor — but the visitor who *refuses* has to be left alone by
 * everything, not only by the services that misbehaved on the day we looked.
 *
 * The list is derived and never stored. It is generated from the store's most
 * recent reading against the tracker table as it stands, so a service named in
 * that table today is blocked by code generated today, from a reading taken
 * last week. A blocklist column would be this going stale somewhere nobody
 * looks.
 */
export function blocklistFrom(
  reading: Reading,
  trackers: readonly PurposefulTracker[]
): Blocklist {
  const matched = matchedTrackers(reading, trackers);

  const blocked = matched
    .filter((tracker) => tracker.purpose !== "essential")
    .map(({ name, purpose, cookie_pattern, host_pattern }) => ({
      name,
      purpose: purpose as BlockablePurpose,
      cookie: cookie_pattern,
      host: host_pattern,
    }));

  const unnamed = new Set(
    (reading.requests ?? [])
      .filter(({ host }) => !nameHost(host, trackers))
      .map(({ host }) => registrableDomain(host))
  );

  return {
    blocked,
    essential: matched
      .filter((tracker) => tracker.purpose === "essential")
      .map(({ name }) => name),
    unnamed: [...unnamed],
  };
}

/** Which of the two answerable purposes this store actually has. */
export function purposesIn(blocklist: Blocklist): BlockablePurpose[] {
  return BLOCKABLE_PURPOSES.filter((purpose) =>
    blocklist.blocked.some((tracker) => tracker.purpose === purpose)
  );
}
