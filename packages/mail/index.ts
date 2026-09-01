/**
 * Sending an e-mail that is not a magic link.
 *
 * The magic link does not come through here, and the split is worth reading
 * before adding anything: Supabase generates that token, builds the link from
 * the Site URL and the template, and hands the finished message to SMTP. Resend
 * is pure transport there and does not know it is carrying a login. A wrong
 * link is fixed in Supabase; a message that never arrives is investigated in
 * Resend.
 *
 * This module is the other kind — a message the product itself decided to
 * write. Same provider, opposite direction: here we compose and Resend
 * delivers.
 *
 * Sending over HTTP rather than through the SDK, which is one dependency for
 * one POST. The API is three fields and has been three fields for years.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Long enough for a POST, short enough to not hold a scan's invocation open. */
const TIMEOUT_MS = 10_000;

export type Mail = {
  to: string;
  subject: string;
  /** Plain text. Nothing this product sends is worth an HTML template yet. */
  text: string;
};

/**
 * Why a send did not happen, or that it did.
 *
 * A result rather than a thrown error, because every caller so far is doing
 * something more important than sending: the alert goes out at the end of a
 * scan, and a scan that fails to record its reading because an e-mail provider
 * was down would be trading the product for the notification about it.
 */
export type Sent =
  | { sent: true; id: string }
  | { sent: false; reason: "unconfigured" | "refused" | "unreachable" };

/**
 * Read lazily and never at module load, for the same reason as everywhere else
 * in this repo: Vercel builds before the project has its variables.
 */
const config = () => ({
  key: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM,
});

/**
 * Sends one message, and says plainly when it could not.
 *
 * `unconfigured` is a real, expected answer and not a failure to log loudly.
 * Locally and in preview there is no key, and the alternative — throwing —
 * would mean the queue could not be exercised on a laptop without an e-mail
 * provider standing behind it.
 */
export async function send(mail: Mail): Promise<Sent> {
  const { key, from } = config();
  if (!key || !from) return { sent: false, reason: "unconfigured" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return { sent: false, reason: "refused" };

    const body = (await response.json()) as { id?: string };
    return body.id
      ? { sent: true, id: body.id }
      : { sent: false, reason: "refused" };
  } catch {
    return { sent: false, reason: "unreachable" };
  }
}
