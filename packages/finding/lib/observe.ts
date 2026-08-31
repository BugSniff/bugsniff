/**
 * Turning a reading into the facts a finding can be written about.
 *
 * Nothing here asks a model anything. Which trackers fired, when they fired,
 * and whether the store's own policy names them are facts, and a fact that a
 * model decides is a fact that changes between two runs over the same store.
 * The model's job starts after this file and is only to write (ADR-0001).
 */

/** A cookie as the scan recorded it, reduced to what an observation needs. */
type Cookie = { name: string; phase?: string };

/** A third party the page talked to, likewise. */
type Request = { host: string; phase?: string };

/** The naming table, as `@/packages/tracker` takes it. */
type Tracker = {
  name: string;
  cookie_pattern: string | null;
  host_pattern: string | null;
};

export type Reading = {
  cookies: readonly Cookie[];
  requests: readonly Request[];
  /** What the store publishes, when the scan could read it. */
  policy: { text: string | null; url: string | null };
};

/**
 * One fact about the store, with everything needed to back it.
 *
 * `kind` decides which norms the finding may cite, so the choice of norm never
 * comes from prose — a model can pick among the candidates for one observation,
 * and cannot reach a norm the observation does not admit.
 */
export type Observation =
  /** A named service was already there before the visitor answered anything. */
  | {
      kind: "tracker-before-consent";
      tracker: string;
      cookies: string[];
      hosts: string[];
    }
  /** A named service is in the reading and is not named in the policy. */
  | {
      kind: "tracker-undisclosed";
      tracker: string;
      policyUrl: string;
    };

export const NORM_CANDIDATES: Record<Observation["kind"], readonly string[]> = {
  "tracker-before-consent": ["lgpd-art-7-i", "lgpd-art-8", "lgpd-art-5-xii"],
  "tracker-undisclosed": ["lgpd-art-9", "lgpd-art-6-vi"],
};

function matches(pattern: string | null, value: string): boolean {
  if (!pattern) return false;
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Words in a tracker's name that identify the vendor rather than the product.
 *
 * "Google Analytics" is disclosed by a policy that says Google; "Analytics" on
 * its own names nobody. Dropping the generic half is what keeps the check from
 * reporting a store that discloses its trackers in the vendor's own words.
 */
const GENERIC = new Set([
  "ads",
  "analytics",
  "cdn",
  "fonts",
  "insights",
  "manager",
  "new",
  "pixel",
  "tag",
]);

const vendorWords = (trackerName: string): string[] =>
  fold(trackerName)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !GENERIC.has(word));

/**
 * Whether the policy names this service.
 *
 * Any vendor word is enough, matched on word boundaries so "meta" does not
 * find itself inside "metadados".
 *
 * ponytail: one word, not an alias table. A policy that says "Facebook" does
 * not disclose "Meta Pixel" by this rule, and a policy that says "Google"
 * discloses every Google tracker at once. Both errors run the same way — the
 * store is reported as having disclosed — which is the direction an audit
 * should be wrong in. Add aliases the first time a real policy is misread, not
 * before.
 */
function policyNames(trackerName: string, policy: string): boolean {
  return vendorWords(trackerName).some((word) =>
    new RegExp(`\\b${word}\\b`).test(policy)
  );
}

/** The named services in a reading, and the cookies and hosts each showed up as. */
function byTracker(
  reading: Reading,
  trackers: readonly Tracker[],
  phase?: string
) {
  const found = new Map<string, { cookies: string[]; hosts: string[] }>();

  const entry = (name: string) => {
    const existing = found.get(name) ?? { cookies: [], hosts: [] };
    found.set(name, existing);
    return existing;
  };

  for (const cookie of reading.cookies) {
    if (phase && cookie.phase !== phase) continue;
    const tracker = trackers.find((t) =>
      matches(t.cookie_pattern, cookie.name)
    );
    if (tracker) entry(tracker.name).cookies.push(cookie.name);
  }

  for (const request of reading.requests) {
    if (phase && request.phase !== phase) continue;
    const tracker = trackers.find((t) => matches(t.host_pattern, request.host));
    if (tracker) entry(tracker.name).hosts.push(request.host);
  }

  return found;
}

/** Every fact this reading supports, in the order a report should tell them. */
export function observe(
  reading: Reading,
  trackers: readonly Tracker[]
): Observation[] {
  const observations: Observation[] = [];

  for (const [tracker, where] of byTracker(reading, trackers, "pre-consent")) {
    observations.push({
      kind: "tracker-before-consent",
      tracker,
      cookies: where.cookies,
      hosts: where.hosts,
    });
  }

  // Only against a policy we actually read. "We could not find the policy" is
  // our browser failing to find, never the store failing to publish, and
  // silence about a document we never opened is not a fact about the store.
  const { text, url } = reading.policy;
  if (text && url) {
    const policy = fold(text);
    for (const tracker of byTracker(reading, trackers).keys()) {
      if (!policyNames(tracker, policy)) {
        observations.push({
          kind: "tracker-undisclosed",
          tracker,
          policyUrl: url,
        });
      }
    }
  }

  return observations;
}

/** The concrete backing for an observation. Authored here, never by a model. */
export function evidenceFor(observation: Observation): string {
  if (observation.kind === "tracker-before-consent") {
    const parts = [
      observation.cookies.length > 0 &&
        `cookies ${observation.cookies.join(", ")}`,
      observation.hosts.length > 0 &&
        `requisições para ${observation.hosts.join(", ")}`,
    ].filter((part): part is string => typeof part === "string");

    return `${observation.tracker}: ${parts.join(" e ")}, na leitura feita antes de qualquer interação com o banner.`;
  }

  return `${observation.tracker} foi observado no exame, e o nome não aparece no texto da política publicada em ${observation.policyUrl}.`;
}
