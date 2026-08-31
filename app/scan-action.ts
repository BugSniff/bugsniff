"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { canonicalHost } from "@/lib/store";
import { parseTargetUrl } from "@/packages/scan/target-url";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/**
 * The pages that start a scan, and therefore the only places to return to.
 *
 * A shape, not a list, because one of them carries a store's id. Still closed:
 * it goes into a redirect, and a path taken from the form is a path a stranger
 * can write.
 */
const FROM = /^\/$|^\/painel$|^\/loja\/[0-9a-f-]{36}$/;

/**
 * The store this address belongs to, created if this is its first reading.
 *
 * `on_conflict` rather than a read followed by a write: two scans of the same
 * shop started at the same moment would both find nothing and both insert, and
 * the shop would end up with two histories — which is exactly what the unique
 * index and this rule exist to prevent. The database decides, once.
 *
 * Runs with the service role because `stores` has no insert policy, by design:
 * a store is a thing our own server recorded, not something a visitor asserts.
 */
export async function storeFor(
  organizationId: string,
  url: URL
): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("stores")
    .upsert(
      { organization_id: organizationId, host: canonicalHost(url.href) },
      { onConflict: "organization_id,host" }
    )
    .select("id")
    .single();

  return data?.id ?? null;
}

/** Nudges the queue after the response is sent, so nobody waits on a browser. */
async function kickQueue() {
  const origin = (await headers()).get("origin");
  after(() =>
    fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
      // The waiting screen tries again on its next render.
    })
  );
}

/**
 * Starts a scan.
 *
 * Two paths, and the only difference is whether the gate still has anything to
 * prove. The gate exists to establish that whoever asked owns the address they
 * typed — and a live session already established exactly that. Asking again is
 * friction that also spends a magic link to reconfirm something confirmed.
 *
 * Signed in, the scan is queued at once and the person goes straight to it.
 * Signed out, the scan is parked and clicking the link in the inbox releases it.
 */
export async function requestScan(formData: FormData) {
  // Where to come back to when something goes wrong. Three forms start a scan
  // — the landing, the panel and a store's own page — and each has to keep the
  // person where they were.
  const asked = String(formData.get("voltar"));
  const voltar = FROM.test(asked) ? asked : "/";

  const target = await parseTargetUrl(String(formData.get("url") ?? ""));
  if (!target.ok) redirect(`${voltar}?erro=${target.reason}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // RLS scopes this to the caller, so it is always their own.
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .maybeSingle();

    if (!organization) redirect(`${voltar}?erro=sem-organizacao`);

    const storeId = await storeFor(organization.id, target.url);
    if (!storeId) redirect(`${voltar}?erro=nao-registrado`);

    const { data: scan } = await createAdminClient()
      .from("scans")
      .insert({
        url: target.url.href,
        organization_id: organization.id,
        store_id: storeId,
        status: "pending",
        pending_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!scan) redirect(`${voltar}?erro=nao-registrado`);

    await kickQueue();
    redirect(`/exame/${scan.id}`);
  }

  // Nobody signed in: park the URL and let the inbox release it. The URL does
  // not travel inside the e-mail — a link the recipient could edit would point
  // the scan elsewhere with the gate already passed — so the link carries the
  // claim token and the URL stays in the row.
  const { data: parked } = await createAdminClient()
    .from("scans")
    .insert({ url: target.url.href })
    .select("claim_token")
    .single();

  if (!parked) redirect(`${voltar}?erro=nao-registrado`);

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email: String(formData.get("email") ?? ""),
    options: {
      emailRedirectTo: `${origin}/auth/callback?scan=${parked.claim_token}`,
    },
  });

  if (error) redirect(`${voltar}?erro=nao-enviado`);
  redirect(
    `/?enviado=${encodeURIComponent(String(formData.get("email") ?? ""))}`
  );
}
