/**
 * Putting a name to what a store wrote, and to who it talked to.
 *
 * `_fbp` means nothing to the person who owns the shop. "Meta Pixel" means
 * something, and it is the same fact. This is the whole module: the lookup that
 * turns one into the other.
 *
 * Deliberately not a model's job (ADR-0001). A language model asked what `_fbp`
 * is would answer correctly nearly every time, and the nearly is the problem —
 * an audit that names the wrong service in a report about somebody's shop has
 * no way for the reader to tell which time it was.
 */

/** One line of the correspondence, as it comes from the database. */
export type Tracker = {
  /** The name a person recognises. The vendor's, not ours. */
  name: string;
  /** A regular expression over a cookie's name. */
  cookie_pattern: string | null;
  /** A regular expression over a third-party host. */
  host_pattern: string | null;
};

/**
 * Matches one value against one pattern.
 *
 * A pattern that does not compile is skipped rather than thrown. The list is
 * data, editable without a deploy, and one bad row should cost one name, not
 * the whole report.
 */
function matches(pattern: string | null, value: string): boolean {
  if (!pattern) return false;

  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
}

/**
 * The service that wrote this cookie, when we can say which.
 *
 * `null` is a real answer, and the one that must never turn into a guess: most
 * cookies a shop writes are its own — a session, a cart, a CSRF token — and
 * calling those trackers would be inventing a fact about the shop.
 */
export function nameCookie(
  cookieName: string,
  trackers: readonly Tracker[]
): string | null {
  return (
    trackers.find(({ cookie_pattern }) => matches(cookie_pattern, cookieName))
      ?.name ?? null
  );
}

/** The service behind this host, when we can say which. */
export function nameHost(
  host: string,
  trackers: readonly Tracker[]
): string | null {
  return (
    trackers.find(({ host_pattern }) => matches(host_pattern, host))?.name ??
    null
  );
}

/**
 * The distinct services behind a reading, whichever way they showed up.
 *
 * A service seen as a cookie *and* as a request is one service, not two — the
 * Meta Pixel that writes `_fbp` and calls `connect.facebook.net` is the same
 * pixel, and counting it twice would inflate every number the report prints.
 *
 * Generic over the row so a caller that selected more columns gets them back.
 * The consent banner needs exactly that: it derives its blocklist from the
 * services a reading found, and it cannot block one without the patterns and
 * the purpose that came on the row.
 */
export function matchedTrackers<T extends Tracker>(
  reading: {
    cookies?: readonly { name: string }[];
    requests?: readonly { host: string }[];
  },
  trackers: readonly T[]
): T[] {
  const matched = new Map<string, T>();

  const keep = (tracker: T | undefined) => {
    if (tracker && !matched.has(tracker.name))
      matched.set(tracker.name, tracker);
  };

  for (const cookie of reading.cookies ?? []) {
    keep(
      trackers.find(({ cookie_pattern }) =>
        matches(cookie_pattern, cookie.name)
      )
    );
  }

  for (const request of reading.requests ?? []) {
    keep(
      trackers.find(({ host_pattern }) => matches(host_pattern, request.host))
    );
  }

  return [...matched.values()];
}

/** The same reading, reduced to the names a person recognises. */
export function namedTrackers(
  reading: {
    cookies?: readonly { name: string }[];
    requests?: readonly { host: string }[];
  },
  trackers: readonly Tracker[]
): string[] {
  return matchedTrackers(reading, trackers).map(({ name }) => name);
}
