import { lookup } from "node:dns/promises";
import { isIPv4 } from "node:net";

/**
 * Why a stranger's URL cannot be handed straight to a browser.
 *
 * A scan is started by anyone, without an account, and it drives a real browser
 * from inside our own network. `http://169.254.169.254/` is the cloud instance
 * metadata endpoint; `http://127.0.0.1:54321` is whatever else is listening on
 * the machine. Fetching those and showing the response back is a server-side
 * request forgery, and the visitor never has to leave the form to do it.
 */

/** What a target may fail on, in terms a person can act on. */
export type TargetRejection =
  | "malformed"
  | "unsupported-scheme"
  | "unsupported-port"
  | "unresolvable"
  | "private-address";

export type TargetUrl =
  { ok: true; url: URL } | { ok: false; reason: TargetRejection };

/**
 * IPv4 ranges that are not the public internet.
 *
 * Expressed as [first octet, predicate] so the check stays readable next to the
 * RFC that defines each one — a regex over dotted quads would not survive
 * review.
 */
function isPrivateIPv4(address: string): boolean {
  const [a, b] = address.split(".").map(Number);

  return (
    a === 0 || // 0.0.0.0/8, "this network"
    a === 10 || // RFC 1918 private
    a === 127 || // loopback
    (a === 169 && b === 254) || // RFC 3927 link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // RFC 1918 private
    (a === 192 && b === 168) || // RFC 1918 private
    (a === 100 && b >= 64 && b <= 127) || // RFC 6598 carrier-grade NAT
    (a === 192 && b === 0) || // RFC 6890 protocol assignments
    (a === 198 && (b === 18 || b === 19)) || // RFC 2544 benchmarking
    a >= 224 // multicast and reserved, through 255.255.255.255
  );
}

function isPrivateIPv6(address: string): boolean {
  const plain = address.toLowerCase().split("%")[0];

  // An IPv4-mapped address (::ffff:169.254.169.254) reaches the same host as
  // the v4 form, so it has to answer to the same rules.
  const mapped = plain.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return (
    plain === "::1" || // loopback
    plain === "::" || // unspecified
    /^f[cd]/.test(plain) || // fc00::/7 unique local
    /^fe[89ab]/.test(plain) || // fe80::/10 link local
    plain.startsWith("2001:db8:") // documentation range
  );
}

function isPrivate(address: string): boolean {
  return isIPv4(address) ? isPrivateIPv4(address) : isPrivateIPv6(address);
}

/** Exported for the tests: the address rules are the security boundary. */
export const isPrivateAddress = isPrivate;

/**
 * Turns text a stranger typed into a URL that is safe to open.
 *
 * Bare hostnames get `https://`, because that is what people paste.
 *
 * ponytail: the hostname is resolved here and resolved again by the browser, so
 * a name that answers with a public address now and a private one a moment
 * later still gets through (DNS rebinding). Closing that means pinning the
 * resolved address for the browser's own connection; worth doing when scans run
 * against untrusted input at volume rather than one at a time behind a form.
 */
export async function parseTargetUrl(raw: string): Promise<TargetUrl> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "malformed" };

  // Reject a foreign scheme before assuming https, not after. Prepending
  // "https://" to "file:///etc/passwd" produces a URL that parses fine and is
  // rejected much later for the wrong reason.
  //
  // The digit lookahead is what separates a scheme from a host and a port:
  // "loja.com" is a syntactically valid scheme name, so "loja.com:8080" would
  // otherwise read as one.
  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):(?!\d)/i)?.[1];
  if (scheme && !/^https?$/i.test(scheme)) {
    return { ok: false, reason: "unsupported-scheme" };
  }

  let url: URL;
  try {
    url = new URL(scheme ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported-scheme" };
  }

  // A store lives on the default port. Anything else is far more likely to be
  // someone probing what else listens on this network than a real shop.
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, reason: "unsupported-port" };
  }

  if (!url.hostname) return { ok: false, reason: "malformed" };

  // A literal address skips DNS entirely, so check it as written.
  const literal = url.hostname.replace(/^\[|\]$/g, "");
  if (isIPv4(literal) || literal.includes(":")) {
    return isPrivate(literal)
      ? { ok: false, reason: "private-address" }
      : { ok: true, url };
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    return { ok: false, reason: "unresolvable" };
  }

  if (addresses.length === 0) return { ok: false, reason: "unresolvable" };

  // Every answer has to be public. A name that resolves to one public and one
  // private address is the shape of an attack, not of a shop.
  if (addresses.some(({ address }) => isPrivate(address))) {
    return { ok: false, reason: "private-address" };
  }

  return { ok: true, url };
}
