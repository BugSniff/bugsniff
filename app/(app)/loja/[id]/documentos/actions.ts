"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyFrom, missingFrom } from "@/packages/document/company";
import { generate, type DocumentKind } from "@/packages/document";
import type { PurposefulTracker } from "@/packages/consent-banner/blocklist";
import { matchedTrackers } from "@/packages/tracker";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/**
 * As três coisas que se faz com um documento: dizer quem é a empresa, gerar uma
 * versão, e declarar que leu.
 *
 * All three share the same authorisation, and it is the same one the banner's
 * action uses: the store is read through the caller's own session, where RLS
 * makes a store outside their organizations simply not exist. The write then
 * goes through the service role, because none of these tables has an insert
 * policy — nothing in this database is written by a claim from a browser.
 */

/** The store, if it exists for whoever is asking. */
async function storeFor(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, host")
    .eq("id", storeId)
    .maybeSingle();

  // Invisible, which for a form only rendered on a page about this store means
  // the id was not the one we put there.
  if (!data) redirect("/painel");

  return data;
}

export async function saveController(formData: FormData) {
  const store = await storeFor(String(formData.get("store") ?? ""));

  // Validated here rather than trusted: these fields end up in a legal document
  // about somebody's company, and the shape they arrive in is a form's shape.
  const details = companyFrom({
    legalName: formData.get("legalName"),
    cnpj: formData.get("cnpj"),
    address: formData.get("address"),
    email: formData.get("email"),
    officer: formData.get("officer"),
    officerEmail: formData.get("officerEmail"),
  });

  await createAdminClient()
    .from("controllers")
    .upsert(
      { store_id: store.id, details, updated_at: new Date().toISOString() },
      { onConflict: "store_id" }
    );

  revalidatePath(`/loja/${store.id}/documentos`);
}

/**
 * Escreve uma versão nova, sempre nova.
 *
 * There is no "regenerate this version": a version is immutable and a legal
 * review is attached to it (ADR-0003), so the only thing generating can do is
 * add. The number is read and written in the same call, which is a race between
 * two people pressing the button at once — the unique index on
 * `(document_id, number)` is what settles it, and the loser sees an error
 * rather than overwriting a version that already exists.
 */
export async function generateVersion(formData: FormData) {
  const store = await storeFor(String(formData.get("store") ?? ""));
  const kind = String(formData.get("kind")) as DocumentKind;

  if (kind !== "privacy_policy" && kind !== "terms_of_use") {
    redirect(`/loja/${store.id}/documentos`);
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Everything the document says about the shop comes from here: the company
  // somebody typed, and the last reading the browser took.
  const [{ data: controller }, { data: readings }, { data: trackers }] =
    await Promise.all([
      supabase
        .from("controllers")
        .select("details")
        .eq("store_id", store.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id, cookies, requests, created_at")
        .eq("store_id", store.id)
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("trackers")
        .select("name, cookie_pattern, host_pattern, purpose"),
    ]);

  const latest = readings?.[0];

  const named = matchedTrackers(
    {
      cookies: (latest?.cookies ?? []) as { name: string }[],
      requests: (latest?.requests ?? []) as { host: string }[],
    },
    (trackers ?? []) as PurposefulTracker[]
  );

  const { data: document } = await admin
    .from("documents")
    .upsert({ store_id: store.id, kind }, { onConflict: "store_id,kind" })
    .select("id")
    .single();

  if (!document) redirect(`/loja/${store.id}/documentos?erro=nao-gerado`);

  const { data: last } = await admin
    .from("document_versions")
    .select("number")
    .eq("document_id", document.id)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const company = companyFrom(controller?.details);

  const { data: version } = await admin
    .from("document_versions")
    .insert({
      document_id: document.id,
      number: (last?.number ?? 0) + 1,
      body: generate(kind, {
        host: store.host,
        company,
        trackers: named.map(({ name, purpose }) => ({ name, purpose })),
        readAt: latest?.created_at ? new Date(latest.created_at) : null,
        at: new Date(),
      }),
      // A copy, not a reference: the owner corrects the CNPJ next week and this
      // version has to keep saying what whoever approved it read.
      company,
      scan_id: latest?.id ?? null,
    })
    .select("number")
    .single();

  if (!version) redirect(`/loja/${store.id}/documentos?erro=nao-gerado`);

  redirect(`/loja/${store.id}/documentos/${kind}/${version.number}`);
}

/**
 * Registra que uma pessoa leu.
 *
 * The one column of a version that may change, and the reason it exists: what
 * the product generated is a legal document about somebody's company, and it
 * goes nowhere on the strength of our own confidence. Approval is a person
 * saying they read it — the database refuses every other edit to the row
 * (`document_versions_are_immutable`).
 */
export async function approveVersion(formData: FormData) {
  const store = await storeFor(String(formData.get("store") ?? ""));
  const versionId = String(formData.get("version") ?? "");

  const supabase = await createClient();

  // Read through the caller's session first: RLS resolves the version back
  // through its document to the store, so a version of another organization is
  // not forbidden here, it is invisible.
  const { data: version } = await supabase
    .from("document_versions")
    .select("id, number, company, documents(kind, store_id)")
    .eq("id", versionId)
    .maybeSingle();

  if (!version) redirect(`/loja/${store.id}/documentos`);

  // The rule, where it can actually hold. The screen also dims the button, and
  // a dimmed button is a suggestion: the form still submits from the keyboard.
  // A version that says `[PREENCHER]` where the controller goes is one nobody
  // may declare they approve, because approving it is the act the whole
  // document hangs from.
  if (missingFrom(companyFrom(version.company)).length > 0) {
    redirect(
      `/loja/${store.id}/documentos/${(version.documents as unknown as { kind: string }).kind}/${version.number}`
    );
  }

  await createAdminClient()
    .from("document_versions")
    .update({ approved_at: new Date().toISOString() })
    .eq("id", version.id);

  revalidatePath(`/loja/${store.id}/documentos`);
}
