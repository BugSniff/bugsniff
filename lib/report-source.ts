import type { createClient } from "@/packages/supabase/server";

/**
 * What a report needs out of a scan, named once.
 *
 * Two callers read the same row for the same purpose — the screen and the PDF
 * route — and a column added to one and forgotten in the other is a report that
 * says different things depending on how you asked for it.
 */
export const REPORT_COLUMNS =
  "id, url, status, created_at, consent_banner, policy_state, policy_url, policy_text, cookies, requests, findings, evidence_pre_path";

/** Where screenshots live, guarded by the scan's own rule. */
const EVIDENCE_BUCKET = "scan-evidence";

/**
 * The screenshot as bytes inside the document, not as a link to it.
 *
 * A signed URL expires, and a PDF does not: a report e-mailed to a lawyer and
 * opened next week would show a broken image where the evidence was. Inlined,
 * the picture belongs to the file.
 */
export async function evidenceImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  const { data } = await supabase.storage.from(EVIDENCE_BUCKET).download(path);
  if (!data) return null;

  const bytes = Buffer.from(await data.arrayBuffer());
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}
