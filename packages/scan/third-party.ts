/**
 * Telling somebody else's host from the store's own.
 *
 * `cdn.loja.com.br` is the store. `connect.facebook.net` is not, and that
 * difference is the whole reason to look at requests at all: a pixel that
 * fires by image or `sendBeacon` writes no cookie, so without this the store
 * can send the visitor's behaviour to a third party and come back with a clean
 * table.
 */

/**
 * Suffixes under which the interesting name is one label further left.
 *
 * ponytail: a hand-written stub of the public suffix list, holding the
 * Brazilian shapes a store here actually uses plus the handful of foreign ones
 * that show up. The real list is thousands of entries and a dependency that
 * needs updating; the cost of being wrong here is a first-party host counted
 * as third-party, which shows up on screen unnamed and misleads nobody. Swap
 * it for the real list when stores outside Brazil become a real case.
 */
const TWO_LABEL_SUFFIXES = [
  "com.br",
  "net.br",
  "org.br",
  "gov.br",
  "edu.br",
  "art.br",
  "ind.br",
  "co.uk",
  "com.ar",
  "com.mx",
  "com.co",
  "com.py",
  "com.uy",
  "co.jp",
];

/**
 * The name a domain is registered under, roughly.
 *
 * `loja.com.br` from `cdn.loja.com.br`, `facebook.net` from
 * `connect.facebook.net`.
 */
export function registrableDomain(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");

  const lastTwo = labels.slice(-2).join(".");
  const take = TWO_LABEL_SUFFIXES.includes(lastTwo) ? 3 : 2;

  return labels.slice(-take).join(".");
}

/**
 * The third-party hosts among these URLs, each named once.
 *
 * Only the host is kept, never the path or the query — those carry the
 * visitor's own identifiers, and an audit that collects them to prove someone
 * else collects them has lost the argument.
 */
export function thirdPartyHosts(
  urls: Iterable<string>,
  storeUrl: URL
): string[] {
  const store = registrableDomain(storeUrl.hostname);
  const hosts = new Set<string>();

  for (const url of urls) {
    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      // A data: or blob: URL. Nothing left the browser, so nobody was told.
      continue;
    }

    if (!host || registrableDomain(host) === store) continue;
    hosts.add(host.toLowerCase());
  }

  return [...hosts];
}
