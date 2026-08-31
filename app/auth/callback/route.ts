import { redirect } from "next/navigation";
import { after, type NextRequest } from "next/server";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/**
 * How Supabase's refusal codes map to ours.
 *
 * Ours, and only three, because what goes back in the URL is a key and never a
 * sentence: `error_description` arrives in the query, so a message passed
 * through would let anyone craft a link that makes the login screen say
 * whatever they like — as a heading, no less. The words live on the screen
 * that shows them; this route only says which of them applies.
 */
const REFUSALS: Record<string, string> = {
  otp_expired: "expirado",
  access_denied: "recusado",
};

/** Anything we do not recognise. The screen has a sentence for it. */
const GENERIC = "invalido";

function backToLogin(refusal: string): never {
  redirect(`/login?expirado=${REFUSALS[refusal] ?? GENERIC}`);
}

/**
 * Where the magic link lands. The only way into the app.
 *
 * When the link carries a `scan`, this is also the moment the gate opens: the
 * scan was parked at `awaiting_confirmation` while the person was only claiming
 * an e-mail address, and clicking a link that arrived in that inbox is the proof
 * that lets it queue. No browser has been launched up to this point.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  if (!code) {
    backToLogin(params.get("error_code") ?? params.get("error") ?? "");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) backToLogin(error.code ?? "");

  const claimToken = params.get("scan");
  if (!claimToken) redirect("/painel");

  // RLS scopes this to the caller, so it can only ever be their own.
  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .maybeSingle();

  if (!organization) redirect("/painel");

  // Adopting needs the service role: `scans` has no update policy, by design.
  // The `awaiting_confirmation` condition is what makes a claim token single
  // use — a second click finds nothing to adopt and simply lands on the scan.
  const { data: scan } = await createAdminClient()
    .from("scans")
    .update({
      organization_id: organization.id,
      status: "pending",
      pending_at: new Date().toISOString(),
    })
    .eq("claim_token", claimToken)
    .eq("status", "awaiting_confirmation")
    .select("id")
    .maybeSingle();

  if (!scan) redirect("/painel");

  // Kick the queue after this response is sent, so the person is not waiting on
  // a browser to start. The worker takes a slot and returns immediately.
  after(() =>
    fetch(`${request.nextUrl.origin}/api/scan-worker`, {
      method: "POST",
    }).catch(() => {
      // The sweeper picks up anything this misses; a failed kick only costs
      // the person the wait until the next sweep.
    })
  );

  redirect(`/exame/${scan.id}`);
}
