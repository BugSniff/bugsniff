"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { settingsFrom } from "@/packages/consent-banner/settings";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/**
 * Keeps the wording and the colours somebody chose for their banner.
 *
 * Two clients, and the split is the authorisation. The store is read through
 * the caller's own session, where RLS makes a store outside their organizations
 * simply not exist; the write then goes through the service role, because
 * `consent_banners` has no insert policy, like every other table here — nothing
 * in this database is written by a claim from a browser.
 *
 * So the check is not "is this person allowed to write this row" but "does this
 * store exist for them at all", which is the same question and the one the
 * database can answer on its own.
 */
export async function saveBannerSettings(formData: FormData) {
  const storeId = String(formData.get("store") ?? "");

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();

  // Invisible, which for a form only rendered on a page about this store means
  // the id was not the one we put there.
  if (!store) redirect("/painel");

  const chosen = settingsFrom({
    colors: {
      background: formData.get("background"),
      foreground: formData.get("foreground"),
      accent: formData.get("accent"),
      accentForeground: formData.get("accentForeground"),
    },
    text: {
      title: formData.get("title"),
      body: formData.get("body"),
      acceptAll: formData.get("acceptAll"),
      rejectAll: formData.get("rejectAll"),
      manage: formData.get("manage"),
    },
  });

  // Only the fields this form owns. `settingsFrom` fills a whole document,
  // defaults included, and storing all of it would freeze today's wording for
  // the labels nobody edited — a store that saved a colour once would keep our
  // old copy for "Salvar escolhas" forever, in a column nobody thinks to
  // migrate. What is absent here is filled in at read time instead.
  const settings = {
    colors: chosen.colors,
    text: {
      title: chosen.text.title,
      body: chosen.text.body,
      acceptAll: chosen.text.acceptAll,
      rejectAll: chosen.text.rejectAll,
      manage: chosen.text.manage,
    },
  };

  await createAdminClient().from("consent_banners").upsert(
    {
      store_id: store.id,
      settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id" }
  );

  revalidatePath(`/loja/${store.id}/banner`);
}
