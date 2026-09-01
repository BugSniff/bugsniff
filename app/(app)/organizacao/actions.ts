"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { send } from "@/packages/mail";
import { createClient } from "@/packages/supabase/server";

/**
 * As quatro coisas que se faz com uma equipe: convidar, revogar, remover e
 * repassar o papel.
 *
 * Nenhuma delas usa a service role, e isso é o ponto. Até este ticket, todo
 * write deste produto passava por um cliente que ignora RLS, porque não havia
 * policy de escrita nenhuma — a organização nascia por trigger e o resto era
 * fato observado pelo nosso próprio navegador. Aqui é diferente: quem escreve é
 * uma pessoa, sobre outras pessoas, e quem decide se ela pode é o banco.
 *
 * Então tudo abaixo roda com a sessão de quem clicou. Um convite para
 * organização alheia não é recusado por um `if` daqui: ele não passa pela
 * policy, e é assim que a regra continua valendo no dia em que alguém escrever
 * outra tela.
 */

/** Para onde tudo volta, com o resultado como chave e nunca como frase. */
const BACK = "/organizacao";

function back(outcome: string): never {
  redirect(`${BACK}?resultado=${outcome}`);
}

/**
 * Convida alguém por e-mail.
 *
 * O endereço é normalizado aqui porque o banco recusa qualquer outra forma —
 * `check (email = lower(email))` — e porque `Maria@Loja.com` e `maria@loja.com`
 * são a mesma caixa de entrada e não podem virar dois convites.
 */
export async function invite(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) back("email-invalido");

  const supabase = await createClient();

  // A própria linha de membro de quem está convidando: a policy exige que o
  // convite seja assinado por ela, e é a RLS que garante que só existe uma
  // visível — a de quem está pedindo.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) back("sem-sessao");

  const { data: me } = await supabase
    .from("members")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me) back("sem-organizacao");

  const { data: created, error } = await supabase
    .from("invites")
    .insert({
      organization_id: me.organization_id,
      email,
      invited_by: me.id,
    })
    .select("token")
    .single();

  // Duas causas, e a pessoa precisa saber qual: já existe convite aberto para
  // esse endereço, ou ela não tem permissão para convidar. O código do Postgres
  // separa as duas; a frase mora na tela.
  if (error) back(error.code === "23505" ? "ja-convidado" : "sem-permissao");

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", me.organization_id)
    .maybeSingle();

  const origin = (await headers()).get("origin");
  const sent = await send({
    to: email,
    subject: `Você foi convidado para ${organization?.name ?? "uma organização"} no bugsniff`,
    text: [
      `${user.email} convidou você para a organização ${organization?.name ?? ""} no bugsniff.`,
      "",
      `Para entrar: ${origin}/convite/${created.token}`,
      "",
      "O convite vale por 7 dias. Se você não esperava isto, ignore este e-mail — nada acontece sem você abrir o link.",
    ].join("\n"),
  });

  revalidatePath(BACK);

  // O convite existe no banco mesmo quando o e-mail não sai, e a tela precisa
  // dizer isso: apagar a linha esconderia um convite válido, e fingir que
  // enviou deixaria alguém esperando um e-mail que nunca chega. O link fica à
  // vista na lista, para ser passado à mão.
  back(sent.sent ? "convidado" : "convidado-sem-email");
}

/** Revoga um convite pendente. Revogar é apagar: convite não se edita. */
export async function revoke(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", String(formData.get("invite") ?? ""));

  revalidatePath(BACK);
  back(error ? "sem-permissao" : "revogado");
}

/**
 * Remove um membro.
 *
 * A policy é que decide, e ela não alcança o proprietário. Um delete que não
 * casa com policy nenhuma não dá erro: ele apaga zero linhas. Por isso o
 * resultado é conferido pela contagem e não pelo `error` — silêncio aqui seria
 * uma tela dizendo "removido" sobre alguém que continua dentro.
 */
export async function removeMember(formData: FormData) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("members")
    .delete()
    .eq("id", String(formData.get("member") ?? ""))
    .select("id");

  revalidatePath(BACK);
  back(data && data.length > 0 ? "removido" : "sem-permissao");
}

/** Repassa a propriedade. Quem sai fica como administrador. */
export async function transfer(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("transfer_ownership", {
    to_member: String(formData.get("member") ?? ""),
  });

  revalidatePath(BACK);
  back(error ? "sem-permissao" : (data as string));
}
