/**
 * The store, as a person says it.
 *
 * `https://www.loja.com.br/` is the address we examined and the one the report
 * shows in full; `loja.com.br` is what somebody scanning a list of their own
 * shops actually reads.
 */
export function storeName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // A row whose URL we cannot parse is still a row. Showing it raw beats
    // showing nothing about which store it was.
    return url;
  }
}
