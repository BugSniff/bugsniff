import { appeared, alertMessage, type StoreChange } from "./monitoring";
import type { Exam } from "./exams";
import { send } from "@/packages/mail";
import type { createAdminClient } from "@/packages/supabase/admin";
import type { Tracker } from "@/packages/tracker";

/**
 * O aviso que sai quando o exame automático encontra coisa nova.
 *
 * Em duas metades, e a separação é o desenho. A leitura **registra** o que
 * apareceu; quem termina por último na organização **envia** um aviso só,
 * cobrindo todas as lojas que mudaram. Uma agência com quarenta lojas receberia
 * quarenta e-mails numa manhã, que é o mesmo que receber nenhum — ninguém lê o
 * trigésimo, e o que se perde é a leitura que importava.
 *
 * É a única parte do produto que fala com alguém sem ter sido chamada, e por
 * isso todo caminho aqui termina em silêncio em vez de exceção: a leitura já
 * está gravada quando isto começa, e um provedor de e-mail fora do ar não pode
 * derrubar a invocação que acabou de gravá-la.
 */

type Admin = ReturnType<typeof createAdminClient>;

const READING =
  "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id";

/**
 * Anota nesta leitura o que ela trouxe de novo, sem mandar nada.
 *
 * A leitura anterior é a última **concluída**, não a linha imediatamente
 * anterior: comparar contra um exame que falhou faria a loja inteira parecer ter
 * aparecido de uma vez, e o primeiro aviso do produto seria um alarme falso de
 * vinte serviços.
 */
export async function recordAppearances(
  supabase: Admin,
  scanId: string
): Promise<void> {
  const { data: latest } = await supabase
    .from("scans")
    .select(`${READING}, organization_id, monitored`)
    .eq("id", scanId)
    .single();

  // Só o exame automático avisa. Quem clicou "examinar de novo", sozinho ou em
  // lote, está olhando a tela enquanto ele roda.
  if (!latest?.monitored || !latest.store_id || !latest.organization_id) return;

  const { data: history } = await supabase
    .from("scans")
    .select(READING)
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

  // O caso normal, e o motivo de o aviso não virar ruído: quase toda leitura
  // encontra exatamente o que a anterior encontrou, e sobre isso não se escreve.
  if (appearances.length === 0) return;

  await supabase
    .from("scans")
    .update({ appeared: { previousAt: previous.created_at, appearances } })
    .eq("id", scanId);
}

/** O que uma leitura anotou, como foi gravado. */
type Appeared = { previousAt: string; appearances: StoreChange["appearances"] };

/**
 * Manda o aviso da organização, se esta foi a última leitura dela.
 *
 * Não há "fim da varredura" para se pendurar: em serverless cada exame é uma
 * invocação e ninguém coordena o conjunto. Então quem termina pergunta se sobrou
 * alguém — se sim, cala-se, porque quem terminar depois fará esta mesma
 * pergunta e será o último. O aviso sai uma vez, de quem apagar a luz.
 *
 * Degrada sozinho: se a última invocação morrer, o que ficou sem `alerted_at`
 * entra no aviso da varredura seguinte, em vez de se perder.
 */
export async function sendOrganizationAlert(
  supabase: Admin,
  organizationId: string,
  origin: string
): Promise<void> {
  const { count: inFlight } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["pending", "running"]);

  if (inFlight && inFlight > 0) return;

  const { data: pending } = await supabase
    .from("scans")
    .select("id, store_id, appeared")
    .eq("organization_id", organizationId)
    .not("appeared", "is", null)
    .is("alerted_at", null);

  if (!pending || pending.length === 0) return;

  const { data: stores } = await supabase
    .from("stores")
    .select("id, host")
    .eq("organization_id", organizationId);

  const hostOf = new Map((stores ?? []).map((s) => [s.id, s.host]));

  const changes: StoreChange[] = pending.flatMap((scan) => {
    const host = scan.store_id ? hostOf.get(scan.store_id) : null;
    const recorded = scan.appeared as Appeared | null;

    return host && recorded
      ? [
          {
            host,
            appearances: recorded.appearances,
            previousAt: recorded.previousAt,
            scanUrl: `${origin}/exame/${scan.id}`,
          },
        ]
      : [];
  });

  if (changes.length === 0) return;

  const to = await ownerEmail(supabase, organizationId);
  if (!to) return;

  const sent = await send({ to, ...alertMessage(changes) });

  // A marca só entra quando o e-mail saiu. Marcar antes trocaria "o aviso
  // atrasa um dia" por "o aviso nunca aconteceu e ninguém soube".
  if (sent.sent) {
    await supabase
      .from("scans")
      .update({ alerted_at: new Date().toISOString() })
      .in(
        "id",
        pending.map(({ id }) => id)
      );
  }
}

/** Quem responde pela organização. É a caixa de entrada que já é a conta. */
async function ownerEmail(
  supabase: Admin,
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
