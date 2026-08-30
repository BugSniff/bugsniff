import { after } from "next/server";
import { runScan } from "@/packages/scan/scan";
import { createAdminClient } from "@/packages/supabase/admin";

/** A cold start unpacks Chromium before it can open anything. */
export const maxDuration = 60;

/**
 * The most scans allowed to run at once.
 *
 * Not a capacity limit — Vercel would run far more without noticing. It is a
 * spending ceiling: the most we can burn in an hour is the same whether ten or
 * ten thousand people are waiting. Whoever floods the queue lengthens their own
 * wait, not our bill.
 *
 * Read it as a ceiling, not a target. Parallelism comes from people clicking at
 * the same time — each click starts its own chain and each chain takes one slot.
 * A chain runs its scans one after another, so a backlog drains at roughly one
 * scan per ten seconds, not five.
 *
 * ponytail: making a backlog drain five-wide means a worker that calls itself
 * over HTTP to start a sibling invocation, which needs a base URL it does not
 * currently know. Worth it when a backlog is a real thing that happens; today
 * the queue is almost always empty, and draining slower only spends less.
 */
const MAX_RUNNING = 5;

type Worker = { supabase: ReturnType<typeof createAdminClient> };

/**
 * Runs one scan, records it, then looks for the next one.
 *
 * The chain is what keeps the queue moving without polling: the invocation that
 * just finished hands over to the next before it goes. A crash breaks the
 * chain, which is why the sweeper exists — the chain is for speed, the sweeper
 * is for correctness.
 */
async function work({ supabase }: Worker, scanId: string) {
  const { data: row } = await supabase
    .from("scans")
    .select("url")
    .eq("id", scanId)
    .single();

  if (!row) return;

  const scan = await runScan(row.url);
  const finishedAt = new Date().toISOString();

  await supabase
    .from("scans")
    .update(
      scan.ok
        ? { status: "done", cookies: scan.cookies, finished_at: finishedAt }
        : { status: "failed", failure: scan.reason, finished_at: finishedAt }
    )
    .eq("id", scanId);

  after(() => dispatch());
}

/** Takes a slot for the oldest waiting scan, if any slot is free. */
async function dispatch() {
  const supabase = createAdminClient();

  const { data: next } = await supabase.rpc("next_pending_scan");
  if (!next) return;

  const { data: took } = await supabase.rpc("take_scan_slot", {
    scan: next,
    max_running: MAX_RUNNING,
  });

  // Every slot is busy. The scan stays pending and the invocation that frees a
  // slot will pick it up.
  if (!took) return;

  await work({ supabase }, next);
}

/**
 * Answers straight away and does the work afterwards.
 *
 * Whoever kicks the queue — the auth callback, or the sweeper — should not be
 * held open for ten seconds of someone else's browser.
 */
export async function POST() {
  after(() => dispatch());
  return new Response(null, { status: 202 });
}
