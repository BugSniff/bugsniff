/**
 * The rule that decides whether a store's history is one history or two.
 *
 * A store is identified by its address, and a person types that address a
 * dozen ways: with `www.` and without, http and https, with a path they
 * happened to be on. Every one of those is the same shop, and if we let any of
 * them create a second store, the shop's readings split in half and every
 * sentence the product says about it over time is half true.
 *
 * The canonical form is the host, lowercased, without `www.` — no scheme, no
 * port, no path. It is both the identity in the database and the name on the
 * screen, because there is no reason for those to differ.
 */
export function canonicalHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    // A row whose URL will not parse is still a row. Showing it raw beats
    // showing nothing about which store it was — and nothing reaches the
    // database this way, because a store is only ever created from an address
    // that already went through `parseTargetUrl`.
    return url;
  }
}
