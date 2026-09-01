import { sweepOrphanEvidence } from "@/packages/evidence";
import { createAdminClient } from "@/packages/supabase/admin";

/**
 * Deletes the screenshots of scans that no longer exist.
 *
 * A route rather than a database trigger, and not by preference: Supabase
 * refuses direct deletion from `storage.objects` so that nobody removes the row
 * and leaves the file, which puts the only real deletion behind the storage
 * API. The API needs the service role, and the service role lives here.
 *
 * Daily, and scheduled after the database's own cleanup rather than at the same
 * time: `pg_cron` deletes unconfirmed accounts at 04:17 UTC, cascading away
 * their organizations and scans, and this runs at 05:23 to take the pictures
 * those deletions left behind. The gap is deliberate slack, not precision.
 *
 * Whoever builds the screen for deleting an exam or an organization calls
 * `forgetEvidence` there instead, and the pictures go in the same breath as the
 * row. This stays as the floor under every deletion the database performs
 * without any of our code running.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Deployed, the secret is required — a missing one fails loudly here rather
  // than leaving a deleting endpoint open to whoever guesses the path. Locally
  // there is no cron and no secret, so the sweep can be run by hand with curl.
  if (process.env.VERCEL) {
    if (!secret) {
      return Response.json(
        { error: "CRON_SECRET não está configurado" },
        { status: 500 }
      );
    }

    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response(null, { status: 401 });
    }
  }

  // `?dry=1` lists what would go without touching it. The cron calls the bare
  // path, so a scheduled run always sweeps for real.
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";

  const swept = await sweepOrphanEvidence(createAdminClient(), { dryRun });

  // The numbers, not an empty 200. A cleanup that reports nothing is a cleanup
  // nobody can tell apart from one that did not run.
  return Response.json({ dryRun, ...swept });
}
