import type { CookieOptions } from "@supabase/ssr";

/**
 * How long a PKCE verifier may live, in seconds.
 *
 * It matches the confirmation link the verifier belongs to — Supabase's
 * `otp_expiry`, one hour. A verifier outliving its own link cannot be used by
 * anyone, so this is a ceiling, not a policy choice.
 */
const VERIFIER_MAX_AGE = 3600;

/** Cookie holding the PKCE verifier, one per auth flow started. */
const VERIFIER_SUFFIX = "-code-verifier";

/**
 * Caps how long a PKCE verifier cookie survives.
 *
 * `@supabase/ssr` names the verifier after the flow that created it and gives
 * it 400 days. So every abandoned sign-up — someone who never clicks the link —
 * leaves a cookie that is dead within the hour and lingers for over a year,
 * under a name nothing will ever write to again. Enough of them and the Cookie
 * header outgrows the server's header limit: from then on that person gets 431
 * on every request, and only clearing cookies by hand gets them out.
 *
 * Capping the lifetime needs no bookkeeping about which flow is the live one,
 * which is why it is preferred here over evicting the oldest: a verifier past
 * its link's expiry is unusable regardless of how many others exist.
 */
export function withVerifierExpiry(
  name: string,
  options: CookieOptions
): CookieOptions {
  if (!name.endsWith(VERIFIER_SUFFIX)) return options;
  return { ...options, maxAge: VERIFIER_MAX_AGE };
}
