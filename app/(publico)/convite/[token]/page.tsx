import { IconMail } from "@tabler/icons-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/brand";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/**
 * Onde o convite é aberto.
 *
 * A única porta de entrada numa organização que a pessoa não criou. Ela chega
 * aqui por um link no e-mail, e o que o link prova é a posse da caixa de
 * entrada — o mesmo que o magic link prova, e a mesma razão de não haver senha
 * em lugar nenhum deste produto.
 *
 * O token é lido com a service role porque quem chega ainda não é membro de
 * nada: não existe `is_member_of` que o alcance, e uma policy que deixasse o
 * convidado ler a tabela deixaria qualquer pessoa autenticada lê-la. O token é
 * capacidade portadora, e a checagem que importa não é ler o convite: é bater o
 * endereço da sessão com o endereço do convite, e essa vive dentro de
 * `accept_invite`, no banco.
 */

/** O que sai errado, em frases nossas. Nada vem da URL. */
const REFUSALS: Record<string, string> = {
  inexistente: "Este convite não existe.",
  usado: "Este convite já foi aberto.",
  expirado: "Este convite venceu. Peça um novo a quem convidou você.",
  "outro-endereco":
    "Este convite é para outro endereço de e-mail. Saia da conta atual e abra o link de novo.",
  "organizacao-com-lojas":
    "Sua conta já tem uma organização com lojas dentro. Uma pessoa pertence a uma organização só, então aceitar este convite significaria abandonar as suas lojas — e isso não fazemos por conta própria.",
  "sem-sessao": "Entre para abrir o convite.",
};

export default async function ConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ enviado?: string; erro?: string }>;
}) {
  const { token } = await params;
  const { enviado } = await searchParams;

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id, email, organization_id, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return <Refused reason="inexistente" />;

  // Em duas idas em vez de um join embutido: o nome da organização é a única
  // coisa que o convidado vê dela antes de entrar, e uma linha a mais aqui vale
  // menos do que um tipo que o compilador não consegue afirmar.
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.organization_id)
    .maybeSingle();

  const organization = org?.name ?? "uma organização";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Já entrou: o banco decide, e é ele que confere endereço, validade e o que
  // fazer com a organização que a pessoa talvez já tenha.
  if (user) {
    const { data: outcome } = await supabase.rpc("accept_invite", {
      invite_token: token,
    });

    // `ja-e-membro` é sucesso: quem se cadastrou com o endereço convidado já foi
    // colocado na organização pelo trigger, e chegar aqui depois disso é só
    // recarregar a página.
    if (outcome === "ok" || outcome === "ja-e-membro") redirect("/painel");

    return <Refused reason={String(outcome)} organization={organization} />;
  }

  // Convite já aberto por alguém, e ninguém logado aqui: não há o que fazer.
  if (invite.accepted_at) return <Refused reason="usado" />;
  if (Date.parse(invite.expires_at) < Date.now())
    return <Refused reason="expirado" />;

  /**
   * Manda o link para o endereço **do convite**, e não para um campo.
   *
   * Um formulário de e-mail aqui seria uma porta lateral: qualquer pessoa com o
   * token pediria um link para o próprio endereço e entraria. O endereço vem da
   * linha, e quem não tem a caixa de entrada não abre nada.
   */
  async function sendLink() {
    "use server";
    const client = await createClient();
    const origin = (await headers()).get("origin");

    const { error } = await client.auth.signInWithOtp({
      email: invite!.email,
      options: { emailRedirectTo: `${origin}/convite/${token}` },
    });

    redirect(`/convite/${token}?${error ? "erro=falhou" : "enviado=1"}`);
  }

  return (
    <Centered>
      <Card className="w-[440px] items-center gap-5 px-8 py-10 text-center">
        <Mark size="lg" className="size-12 rounded-2xl">
          <IconMail size={24} stroke={2} />
        </Mark>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-medium">
            Você foi convidado para {organization}
          </h1>
          <p className="text-sm text-muted-foreground">
            {enviado ? (
              <>
                Enviamos um link para <strong>{invite.email}</strong>. Abra-o
                nessa caixa de entrada e você entra direto.
              </>
            ) : (
              <>
                O convite é para <strong>{invite.email}</strong>. Não há senha:
                mandamos um link para esse endereço, e abrir o link é como você
                entra.
              </>
            )}
          </p>
        </div>

        {!enviado && (
          <form action={sendLink} className="w-full">
            <SubmitButton
              working="Enviando…"
              className={`${buttonVariants()} w-full`}
            >
              Receber o link
            </SubmitButton>
          </form>
        )}
      </Card>
    </Centered>
  );
}

function Refused({
  reason,
  organization,
}: {
  reason: string;
  organization?: string;
}) {
  return (
    <Centered>
      <Card className="w-[440px] items-center gap-5 px-8 py-10 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-medium">
            {organization
              ? `Não foi possível entrar em ${organization}`
              : "Este convite não vale"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {REFUSALS[reason] ?? "Este convite não pôde ser aberto."}
          </p>
        </div>

        <Link href="/painel" className={buttonVariants({ variant: "outline" })}>
          Ir para o painel
        </Link>
      </Card>
    </Centered>
  );
}

/** O funil público é uma coluna, centrada, sem mais nada na tela. */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-10">
      {children}
    </main>
  );
}
