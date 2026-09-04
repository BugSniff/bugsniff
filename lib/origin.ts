import { headers } from "next/headers";

/** Only what this needs from a set of request headers, so a test can be one. */
type Headers = { get(name: string): string | null };

/**
 * The origin a request arrived on, from headers a request actually carries.
 *
 * This exists because of the header it does not read. `Origin` is sent on a
 * POST and on a cross-origin fetch, and on nothing else — not on the navigation
 * that renders a page, and not on the RSC fetch behind a soft navigation. So
 * `headers().get("origin")` inside a page is `null`, and every
 * `${origin}/whatever` built from it becomes the literal string
 * `"null/whatever"`.
 *
 * That is not a hypothetical. The queue's own sweeper — the code that nudges
 * the worker when somebody opens an exam that has not started — was built from
 * it, wrapped its fetch in a `.catch(() => {})`, and therefore had never once
 * nudged the queue: every call threw on an unparseable URL and was swallowed.
 * A scan sat `pending` for two hours in production and only moved when a form
 * POST happened to kick the worker for its own reasons.
 *
 * `Host` is on every request there is. The scheme is not, so it comes from the
 * proxy header Vercel sets in front of the function, and a laptop — the one
 * place that header is missing and https would be wrong — is recognised by its
 * hostname rather than assumed about.
 */
export function originFrom(head: Headers): string {
  // `x-forwarded-host` first: behind Vercel's proxy that is the name the
  // visitor typed, while `host` can be the deployment's own.
  const host = head.get("x-forwarded-host") ?? head.get("host") ?? "";
  const forwarded = head.get("x-forwarded-proto");

  return `${forwarded ?? (isLocal(host) ? "http" : "https")}://${host}`;
}

/** A laptop, which is the only place a missing `x-forwarded-proto` means http. */
const isLocal = (host: string): boolean =>
  /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);

/** The same thing, for the request being handled right now. */
export async function requestOrigin(): Promise<string> {
  return originFrom(await headers());
}
