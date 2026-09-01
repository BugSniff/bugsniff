"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { MAX_RUNNING } from "@/lib/queue";
import { createClient } from "@/packages/supabase/server";

/**
 * O que se faz com muitas lojas de uma vez.
 *
 * As duas ações rodam com a sessão de quem clicou, e não com a service role. A
 * de nomear o cliente porque existe policy para ela — e um `grant update` de uma
 * coluna só, para que a permissão não alcance o `host`, que é a identidade da
 * loja. A de examinar em lote porque a própria função no banco checa a
 * participação: sem isso, o endpoint seria um jeito de mandar examinar — e nos
 * fazer pagar por — as lojas de outra organização.
 */

/**
 * Enfileira uma leitura para cada loja da organização.
 *
 * Não é um exame por invocação disparado daqui: a função grava as linhas como
 * `pending` numa instrução só, e a fila cuida do resto, uma invocação por loja
 * como manda o ADR-0002. Quarenta lojas viram quarenta linhas e cinco correntes;
 * o teto de gasto continua sendo o mesmo `MAX_RUNNING` de sempre.
 */
export async function scanAll() {
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .maybeSingle();

  if (!organization) redirect("/painel?erro=sem-organizacao");

  const { data: queued, error } = await supabase.rpc(
    "enqueue_organization_scans",
    { org: organization.id }
  );

  if (error) redirect("/painel?erro=nao-registrado");

  const count = ((queued ?? []) as string[]).length;

  // Nenhuma: ou a organização não tem loja, ou todas já estão na fila. As duas
  // coisas são a mesma resposta para quem clicou — não há nada novo para ver.
  if (count === 0) redirect("/painel?lote=nenhum");

  const origin = (await headers()).get("origin");
  after(async () => {
    await Promise.all(
      Array.from({ length: Math.min(count, MAX_RUNNING) }, () =>
        fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
          // O que não começar fica `pending`, e a fila se recupera na próxima
          // visita a um exame ou na varredura da noite.
        })
      )
    );
  });

  redirect(`/painel?lote=${count}`);
}

/**
 * Diz de qual cliente é uma loja.
 *
 * Um rótulo escrito à mão, e por isso limpo aqui: espaço em branco em volta faz
 * "Padaria" e "Padaria " virarem dois clientes numa lista agrupada por nome, o
 * que é exatamente o defeito que o agrupamento existe para não ter. Rótulo vazio
 * volta a ser nulo, que é "sem cliente".
 */
export async function nameClient(formData: FormData) {
  const client = String(formData.get("client") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ client: client || null })
    .eq("id", String(formData.get("store") ?? ""));

  redirect(error ? "/painel?erro=sem-permissao" : "/painel");
}
