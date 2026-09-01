import { after } from "next/server";
import { MAX_RUNNING } from "@/lib/queue";
import { createAdminClient } from "@/packages/supabase/admin";

/**
 * Reads every store that is due for another reading, without anyone asking.
 *
 * This is the half of the product that only works because nobody is watching.
 * A lojista does not audit their own shop on the Tuesday an app they installed
 * in March starts firing a pixel; they audit it when something already went
 * wrong. The schedule is what turns "encontramos" into "encontramos antes de
 * alguém reclamar".
 *
 * The route does almost nothing itself: the database decides which stores are
 * due, in one statement, and the queue does the rest. All that is left here is
 * to start the chains.
 */
export const maxDuration = 60;

/**
 * How often a store is read again.
 *
 * A week, and not configurable: a per-store schedule is a setting nobody has
 * asked for, on a screen that does not exist, over a product with no store old
 * enough to have an opinion. It is a constant that moves in a commit until a
 * real lojista wants a different one.
 *
 * Written as a Postgres interval because that is what reads it.
 */
const EVERY = "7 days";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Deployed, the secret is required — a missing one fails loudly here rather
  // than leaving an endpoint that spends money open to whoever guesses the
  // path. Locally there is no cron and no secret, so a run can be triggered by
  // hand with curl.
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

  const supabase = createAdminClient();

  // One statement, and it is the whole scheduling decision: which stores have a
  // reading, have nothing in flight, and were last read longer ago than the
  // interval. Doing it in the database is what makes it safe to run twice — two
  // overlapping runs cannot queue the same store, because the second one sees
  // the row the first one just inserted.
  const { data: queued, error } = await supabase.rpc(
    "enqueue_monitoring_scans",
    { every: EVERY }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // `setof uuid`, so PostgREST hands back a bare array of ids.
  const count = ((queued ?? []) as string[]).length;

  // One chain per slot, no more: an extra chain is an invocation that finds
  // every slot taken and goes home. Fewer stores than slots needs fewer chains.
  const chains = Math.min(count, MAX_RUNNING);
  const { origin } = new URL(request.url);

  after(async () => {
    await Promise.all(
      Array.from({ length: chains }, () =>
        fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
          // A chain that never starts leaves its scans `pending`, which is a
          // state the queue recovers from on the next run or the next visit.
        })
      )
    );
  });

  // The numbers, not an empty 200. A scheduled run that reports nothing is a
  // run nobody can tell apart from one that did not happen.
  return Response.json({ every: EVERY, queued: count, chains });
}
