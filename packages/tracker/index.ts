/**
 * Putting a name to what a store wrote.
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
  /** A regular expression over the cookie's name. */
  cookie_pattern: string;
};

/**
 * The service that wrote this cookie, when we can say which.
 *
 * `null` is a real answer, and the one that must never turn into a guess: most
 * cookies a shop writes are its own — a session, a cart, a CSRF token — and
 * calling those trackers would be inventing a fact about the shop.
 *
 * A pattern that does not compile is skipped rather than thrown. The list is
 * data, editable without a deploy, and one bad row should cost one name, not
 * the whole report.
 */
export function nameTracker(
  cookieName: string,
  trackers: readonly Tracker[]
): string | null {
  for (const { name, cookie_pattern } of trackers) {
    try {
      if (new RegExp(cookie_pattern, "i").test(cookieName)) return name;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * The distinct services behind a set of cookies, in the order they first show
 * up.
 *
 * Order matters on the screen: it follows the reading, so a service that fired
 * before anyone was asked appears before one that waited to be allowed.
 */
export function namedTrackers(
  cookies: readonly { name: string }[],
  trackers: readonly Tracker[]
): string[] {
  const names = new Set<string>();

  for (const cookie of cookies) {
    const name = nameTracker(cookie.name, trackers);
    if (name) names.add(name);
  }

  return [...names];
}
