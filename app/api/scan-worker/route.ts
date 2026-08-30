import { after } from "next/server";
import { runScan, type ConsentPhase } from "@/packages/scan/scan";
import { createAdminClient } from "@/packages/supabase/admin";

/** A cold start unpacks Chromium before it can open anything. */
export const maxDuration = 60;

/**
 * Where the browser opens the store from. `gru1` is São Paulo.
 *
 * The rest of the app runs in the project's default region — `iad1`,
 * Washington — and that is fine for rendering pages. The scan is not: a consent
 * platform decides whether to show its banner by the visitor's country, so a
 * store that only asks Brazilians would never be asked to ask us, and the exam
 * would come back clean by accident. It is the measurement's own address.
 *
 * Only this route moves, so nothing else pays the distance.
 */
export const preferredRegion = "gru1";

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

/** Where screenshots live, guarded by the scan's own rule. */
const EVIDENCE_BUCKET = "scan-evidence";

/**
 * Files a screenshot under the scan that produced it.
 *
 * Foldered by scan on purpose: the storage policy resolves the folder back to
 * the row, so a picture is readable by exactly the people the reading is.
 */
async function storeEvidence(
  { supabase }: Worker,
  scanId: string,
  reading: ConsentPhase,
  evidence: Buffer | null
): Promise<string | null> {
  if (!evidence) return null;

  const path = `${scanId}/${reading}.jpg`;

  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, evidence, { contentType: "image/jpeg", upsert: true });

  // A scan without its screenshot is still a scan. Losing the picture is not
  // worth losing the reading it illustrates.
  return error ? null : path;
}

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

  // The pre-consent state, written the moment it exists rather than at the end.
  // The waiting screen listens to this row, so this update is what turns a
  // blank wait into a result that fills in — same scan, same browser, same bill.
  const scan = await runScan(row.url, async ({ cookies, evidence }) => {
    await supabase
      .from("scans")
      .update({
        cookies,
        evidence_pre_path: await storeEvidence(
          { supabase },
          scanId,
          "pre-consent",
          evidence
        ),
      })
      .eq("id", scanId);
  });

  const finishedAt = new Date().toISOString();

  await supabase
    .from("scans")
    .update(
      scan.ok
        ? {
            status: "done",
            cookies: scan.cookies,
            consent_banner: scan.consentBanner,
            consent_platform: scan.consentPlatform,
            evidence_post_path: await storeEvidence(
              { supabase },
              scanId,
              "post-consent",
              scan.evidence.postConsent
            ),
            finished_at: finishedAt,
          }
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
