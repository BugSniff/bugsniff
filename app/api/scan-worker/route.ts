import { after } from "next/server";
import { recordAppearances, sendOrganizationAlert } from "@/lib/alert";
import { MAX_RUNNING } from "@/lib/queue";
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

type Worker = { supabase: ReturnType<typeof createAdminClient> };

/**
 * Hands the queue to the next invocation, over HTTP rather than in process.
 *
 * This is ADR-0002's "uma invocação por loja, nunca um lote numa função só",
 * and it is the line the chain used to cross. Calling `dispatch()` again inside
 * the same request kept every scan of the chain in one invocation, spending one
 * `maxDuration` for all of them — fine for the two scans a person triggers by
 * hand, fatal for the forty a monitoring run queues at once: the fourth one is
 * still reading when the function is killed, and the remaining thirty-six never
 * start.
 *
 * The next invocation answers 202 before doing anything, so this costs the
 * caller a round trip and not a scan.
 */
async function handOver(origin: string) {
  await fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
    // The chain is for speed. Correctness is `requeue_stuck_scans` in the
    // database and whoever next opens a scan that has not started.
  });
}

/**
 * Runs one scan, records it, then looks for the next one.
 *
 * The chain is what keeps the queue moving without polling: the invocation that
 * just finished hands over to the next before it goes. A crash breaks the chain,
 * and `requeue_stuck_scans` in the database is what puts the abandoned reading
 * back — the chain is for speed, the requeue is for correctness.
 */
async function work({ supabase }: Worker, scanId: string, origin: string) {
  const { data: row } = await supabase
    .from("scans")
    .select("url, organization_id")
    .eq("id", scanId)
    .single();

  if (!row) return;

  const organizationId = row.organization_id as string | null;

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
            // What the search had in front of it. Kept even when it succeeded:
            // the links it passed over are as much a part of the reading as the
            // one it stopped on.
            policy_survey: scan.policy.survey,
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
  if (scan.ok) {
    await recordFindings({ supabase }, scanId, scan);
    // Noted on the row, not mailed. The digest goes out once per organization,
    // from whichever reading turns out to be the last one still running.
    await recordAppearances(supabase, scanId);
  }

  // Before handing over, and only if nothing else of this organization is still
  // in flight: this invocation is the one turning the lights off.
  if (organizationId) {
    await sendOrganizationAlert(supabase, organizationId, origin);
  }

  await handOver(origin);
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
async function dispatch(origin: string) {
  const supabase = createAdminClient();

  // Nothing waiting. This is also where a chain ends: the last scan hands over
  // to an invocation that finds an empty queue and returns.
  const { data: next } = await supabase.rpc("next_pending_scan");
  if (!next) return;

  const { data: took } = await supabase.rpc("take_scan_slot", {
    scan: next,
    max_running: MAX_RUNNING,
  });

  // Every slot is busy. The scan stays pending and the invocation that frees a
  // slot will pick it up.
  if (!took) return;

  await work({ supabase }, next, origin);
}

/**
 * Answers straight away and does the work afterwards.
 *
 * Whoever kicks the queue — the auth callback, the monitoring run, or the
 * previous link in the chain — should not be held open for ten seconds of
 * someone else's browser.
 *
 * The origin comes off this request rather than out of a variable, so localhost,
 * every preview deployment and production each hand the queue back to
 * themselves. A preview that chained into production would run its scans there.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  after(() => dispatch(origin));
  return new Response(null, { status: 202 });
}
