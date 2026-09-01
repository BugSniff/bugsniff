import { after } from "next/server";
import { storeEvidence } from "@/packages/evidence";
import { deriveFindings } from "@/packages/finding";
import { runScan } from "@/packages/scan/scan";
import { createAdminClient } from "@/packages/supabase/admin";

/**
 * How long one invocation may take, and why it is this much.
 *
 * A cold start unpacks Chromium before it can open anything, and then the scan
 * spends its own budgets: twenty seconds for the store to answer and finish
 * parsing, twenty for the banner search when a consent platform's trace says
 * one is coming, twenty-five for the policy search, plus the second reading
 * after accepting. They add to roughly two minutes for the worst store, which
 * is measured rather than assumed — smiles.com.br takes ninety-three seconds
 * and its document parses for over a minute.
 *
 * It was 60, which is less than the sum of the budgets the scan declares, so a
 * slow store was killed mid-reading and left its row in `running` until the
 * slot expired. ADR-0002 records 300s as available on the plan; this stays well
 * under it so one pathological store cannot hold a slot for five minutes.
 */
export const maxDuration = 180;

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
  const scan = await runScan(
    row.url,
    async ({ cookies, requests, evidence }) => {
      await supabase
        .from("scans")
        .update({
          cookies,
          requests,
          evidence_pre_path: await storeEvidence(
            supabase,
            scanId,
            "pre-consent",
            evidence
          ),
        })
        .eq("id", scanId);
    }
  );

  const finishedAt = new Date().toISOString();

  await supabase
    .from("scans")
    .update(
      scan.ok
        ? {
            status: "done",
            cookies: scan.cookies,
            requests: scan.requests,
            consent_banner: scan.consentBanner,
            consent_platform: scan.consentPlatform,
            policy_state: scan.policy.state,
            policy_url: "url" in scan.policy ? scan.policy.url : null,
            policy_text: "text" in scan.policy ? scan.policy.text : null,
            evidence_post_path: await storeEvidence(
              supabase,
              scanId,
              "post-consent",
              scan.evidence.postConsent
            ),
            finished_at: finishedAt,
          }
        : {
            status: "failed",
            failure: scan.reason,
            // A store that refused us still showed our browser something, and
            // that picture is the only way anyone tells "we were turned away"
            // from "there was nothing to find".
            evidence_pre_path: await storeEvidence(
              supabase,
              scanId,
              "blocked",
              scan.evidence ?? null
            ),
            finished_at: finishedAt,
          }
    )
    .eq("id", scanId);

  // Findings come after the reading is already on screen, not before it.
  // Writing them is a second round trip to a model, and holding the whole
  // result back for it would trade a page that fills in for a page that waits.
  if (scan.ok) await recordFindings({ supabase }, scanId, scan);

  after(() => dispatch());
}

/**
 * Writes the findings this reading supports, and only the publishable ones.
 *
 * The validator inside `deriveFindings` is what stands between a model's
 * sentence and somebody's report; a rejected finding is dropped here and never
 * reaches the table (ADR-0001).
 */
async function recordFindings(
  { supabase }: Worker,
  scanId: string,
  scan: Extract<Awaited<ReturnType<typeof runScan>>, { ok: true }>
) {
  const { data: trackers } = await supabase
    .from("trackers")
    .select("name, cookie_pattern, host_pattern");

  const { approved } = await deriveFindings(
    {
      cookies: scan.cookies,
      requests: scan.requests,
      policy: {
        text: "text" in scan.policy ? scan.policy.text : null,
        url: "url" in scan.policy ? scan.policy.url : null,
      },
    },
    trackers ?? []
  );

  if (approved.length > 0) {
    await supabase
      .from("scans")
      .update({ findings: approved })
      .eq("id", scanId);
  }
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
