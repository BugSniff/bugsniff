import { appeared, alertMessage } from "./monitoring";
import type { Exam } from "./exams";
import { send } from "@/packages/mail";
import type { createAdminClient } from "@/packages/supabase/admin";
import type { Tracker } from "@/packages/tracker";

/**
 * O aviso que sai quando o exame automático encontra coisa nova.
 *
 * Roda no fim de uma leitura que ninguém pediu, e é a única parte do produto
 * que fala com alguém sem ter sido chamada. Por isso todo caminho aqui termina
 * em silêncio em vez de exceção: a leitura já está gravada quando isto começa,
 * e um provedor de e-mail fora do ar não pode derrubar a invocação que acabou
 * de gravá-la.
 */

/** Quem responde pela organização. É a caixa de entrada que já é a conta. */
async function ownerEmail(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<string | null> {
  const { data: owner } = await supabase
    .from("members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .maybeSingle();

  if (!owner) return null;

  // O e-mail mora em `auth.users`, que não é lido por PostgREST. A API de admin
  // é o caminho, e ela já exige a service role — que é quem roda isto.
  const { data } = await supabase.auth.admin.getUserById(owner.user_id);
  return data.user?.email ?? null;
}

/**
 * Avisa o proprietário se esta leitura trouxe rastreador que a anterior não
 * tinha.
 *
 * A leitura anterior é a última **concluída**, não a linha imediatamente
 * anterior: comparar contra um exame que falhou faria a loja inteira parecer
 * ter aparecido de uma vez, e o primeiro aviso do produto seria um alarme falso
 * de vinte serviços.
 */
export async function alertOnNewTrackers(
  supabase: ReturnType<typeof createAdminClient>,
  scanId: string,
  origin: string
): Promise<void> {
  const { data: latest } = await supabase
    .from("scans")
    .select(
      "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id, organization_id, monitored"
    )
    .eq("id", scanId)
    .single();

  // Só o exame automático avisa. Quem clicou "examinar de novo" está olhando a
  // tela enquanto ele roda.
  if (!latest?.monitored || !latest.store_id || !latest.organization_id) return;

  const { data: history } = await supabase
    .from("scans")
    .select(
      "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id"
    )
    .eq("store_id", latest.store_id)
    .eq("status", "done")
    .neq("id", scanId)
    .order("created_at", { ascending: false })
    .limit(1);

  const previous = history?.[0];
  if (!previous) return;

  const { data: trackers } = await supabase
    .from("trackers")
    .select("name, cookie_pattern, host_pattern");

  const appearances = appeared(
    previous as Exam,
    latest as Exam,
    (trackers ?? []) as Tracker[]
  );

  // O caso normal, e o motivo de o alerta não virar ruído: quase toda leitura
  // encontra exatamente o que a anterior encontrou, e sobre isso não se escreve.
  if (appearances.length === 0) return;

  const to = await ownerEmail(supabase, latest.organization_id);
  if (!to) return;

  const { data: store } = await supabase
    .from("stores")
    .select("host")
    .eq("id", latest.store_id)
    .single();

  if (!store) return;

  await send({
    to,
    ...alertMessage({
      host: store.host,
      appearances,
      previousAt: previous.created_at,
      scanUrl: `${origin}/exame/${latest.id}`,
    }),
  });
}
