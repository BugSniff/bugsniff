import { IconAlertCircle, IconCrown, IconMail } from "@tabler/icons-react";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requestOrigin } from "@/lib/origin";
import { timeAgo } from "@/lib/time";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";
import { invite, removeMember, revoke, transfer } from "./actions";

/**
 * Quem entra, quem sai e quem manda.
 *
 * A tela existe porque o convite não pode ser entregue sozinho. Enquanto uma
 * organização era uma pessoa, excluir essa pessoa levava a organização junto e
 * isso estava certo (ADR-0004). Com duas pessoas dentro, a mesma regra derruba
 * calada uma conta com as lojas de outra — então o repasse do papel mora nesta
 * mesma tela, ao lado do convite, e não numa issue seguinte.
 */

/** Como cada papel se lê, e é a única definição de `admin` que o produto tem. */
const ROLES = {
  owner: { label: "Proprietário", detail: "convida, remove e repassa o papel" },
  admin: { label: "Administrador", detail: "convida e remove" },
  member: { label: "Membro", detail: "lê os exames da organização" },
} as const;

type Role = keyof typeof ROLES;

/**
 * O que aconteceu, em palavras nossas.
 *
 * Chaves na URL e frases aqui, pela mesma regra do resto do produto: uma query
 * string é escrita por quem escreveu o link, e um texto que atravessa a URL é um
 * texto que qualquer pessoa pode fazer esta tela dizer.
 */
const OUTCOMES: Record<string, string> = {
  convidado: "Convite enviado.",
  "convidado-sem-email":
    "O convite foi criado, mas não conseguimos enviar o e-mail. Passe o link da lista abaixo à mão.",
  "ja-convidado": "Já existe um convite aberto para esse endereço.",
  "email-invalido": "Esse e-mail não parece válido.",
  revogado: "Convite revogado.",
  removido: "Membro removido.",
  ok: "Propriedade repassada. Você continua como administrador.",
  "para-si-mesmo": "Você já é o proprietário.",
  "nao-e-proprietario": "Só o proprietário repassa o papel.",
  inexistente: "Essa pessoa não está mais na organização.",
  "sem-permissao": "Você não tem permissão para isso.",
  "sem-organizacao": "Sua conta não está em nenhuma organização.",
  "sem-sessao": "Entre de novo para continuar.",
};

export default async function OrganizacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { resultado } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS já escopa tudo abaixo à organização de quem pede, então não há filtro a
  // aplicar aqui e nada a vazar perguntando.
  const [{ data: organization }, { data: members }, { data: invites }] =
    await Promise.all([
      supabase.from("organizations").select("id, name").maybeSingle(),
      supabase
        .from("members")
        .select("id, user_id, role, created_at")
        .order("created_at"),
      supabase
        .from("invites")
        .select("id, email, token, created_at, expires_at, accepted_at")
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  const me = members?.find((member) => member.user_id === user?.id);
  const canManage = me?.role === "owner" || me?.role === "admin";
  const isOwner = me?.role === "owner";

  // Not the `Origin` header, which a page render never carries: with `?? ""`
  // the invite link below rendered as "/convite/<token>", and an admin copying
  // it handed somebody a URL with no host on it.
  const origin = await requestOrigin();

  return (
    <AppShell
      active="/organizacao"
      crumbs={<strong className="font-medium text-foreground">Membros</strong>}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
          {organization?.name ?? "Organização"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Quem entra numa organização entra por convite, e é o único caminho.
        </p>
      </div>

      {resultado && OUTCOMES[resultado] && (
        <p role="status" className="text-sm text-muted-foreground">
          {OUTCOMES[resultado]}
        </p>
      )}

      <Members
        members={await withEmails(members ?? [])}
        me={me?.id}
        canManage={canManage}
        isOwner={isOwner}
      />

      {canManage && (
        <>
          <Invite />
          <Pending invites={invites ?? []} origin={origin} />
        </>
      )}
    </AppShell>
  );
}

/** A data de vencimento é futura, e `timeAgo` só sabe falar do passado. */
const until = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

type Member = {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
  email: string | null;
};

/**
 * Os endereços das pessoas, que não moram numa tabela que o produto possa ler.
 *
 * `auth.users` não é exposta pelo PostgREST, e de propósito. A leitura passa
 * pela API de admin, depois de a RLS já ter decidido quais linhas de `members`
 * quem pede pode ver — então o que se resolve aqui é sempre gente da própria
 * organização de quem está olhando, e nunca um id que veio de fora.
 */
async function withEmails(
  members: { id: string; user_id: string; role: string; created_at: string }[]
): Promise<Member[]> {
  const admin = createAdminClient();

  return Promise.all(
    members.map(async (member) => ({
      ...member,
      role: member.role as Role,
      email:
        (await admin.auth.admin.getUserById(member.user_id)).data.user?.email ??
        null,
    }))
  );
}

function Members({
  members,
  me,
  canManage,
  isOwner,
}: {
  members: Member[];
  /** A linha de quem está olhando, para não oferecer a ela ações sobre si. */
  me?: string;
  canManage: boolean;
  isOwner: boolean;
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-col gap-1 px-6 py-5">
        <span className="font-heading text-base font-medium">Membros</span>
        <span className="text-xs text-muted-foreground">
          {members.length === 1 ? "1 pessoa" : `${members.length} pessoas`} com
          acesso aos exames desta organização
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-mono text-xs">
                  {member.email ?? "—"}
                  {member.id === me && (
                    <span className="ml-2 text-muted-foreground">você</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={member.role === "owner" ? "default" : "outline"}
                  >
                    {member.role === "owner" && (
                      <IconCrown size={12} stroke={2} />
                    )}
                    {ROLES[member.role].label}
                  </Badge>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ROLES[member.role].detail}
                  </span>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {timeAgo(member.created_at)}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {/* Repassar só aparece para o proprietário, e nunca sobre
                        ele mesmo: o banco recusa as duas coisas, e um botão
                        que só serve para receber "não" é um botão que mente. */}
                    {isOwner && member.role !== "owner" && (
                      <form action={transfer}>
                        <input type="hidden" name="member" value={member.id} />
                        <SubmitButton
                          working="Repassando…"
                          className={buttonVariants({
                            variant: "ghost",
                            size: "xs",
                          })}
                        >
                          Tornar proprietário
                        </SubmitButton>
                      </form>
                    )}

                    {canManage && member.role !== "owner" && (
                      <form action={removeMember}>
                        <input type="hidden" name="member" value={member.id} />
                        <SubmitButton
                          working="…"
                          className={buttonVariants({
                            variant: "ghost",
                            size: "xs",
                          })}
                        >
                          {member.id === me ? "Sair" : "Remover"}
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* O teto do ADR-0004, dito na tela em que ele importa. */}
      <p className="border-t px-6 py-4 text-xs text-muted-foreground">
        O proprietário não pode ser removido nem excluir a própria conta
        enquanto houver outra pessoa aqui dentro — a organização iria junto, e
        levaria as lojas. Repasse o papel primeiro.
      </p>
    </Card>
  );
}

function Invite() {
  return (
    <Card className="gap-4 px-6">
      <div className="flex flex-col gap-1">
        <span className="font-heading text-base font-medium">
          Convidar alguém
        </span>
        <span className="text-xs text-muted-foreground">
          O convite vale por 7 dias e leva um link. Não existe senha: quem abrir
          o link na própria caixa de entrada é quem entra.
        </span>
      </div>

      <form action={invite} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="pessoa@empresa.com.br"
          />
        </div>
        <SubmitButton working="Enviando…" className={buttonVariants()}>
          <IconMail size={14} stroke={2} /> Convidar
        </SubmitButton>
      </form>
    </Card>
  );
}

function Pending({
  invites,
  origin,
}: {
  invites: {
    id: string;
    email: string;
    token: string;
    created_at: string;
    expires_at: string;
  }[];
  origin: string;
}) {
  if (invites.length === 0) return null;

  const now = Date.now();

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-col gap-1 px-6 py-5">
        <span className="font-heading text-base font-medium">
          Convites pendentes
        </span>
        <span className="text-xs text-muted-foreground">
          Ainda não abertos. O link está à vista para poder ser passado à mão
          quando o e-mail não chega.
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((pending) => {
              const expired = Date.parse(pending.expires_at) < now;

              return (
                <TableRow key={pending.id}>
                  <TableCell className="font-mono text-xs">
                    {pending.email}
                  </TableCell>
                  <TableCell className="truncate font-mono text-[11px] text-muted-foreground">
                    {origin}/convite/{pending.token}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {expired ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <IconAlertCircle size={12} stroke={2} /> vencido
                      </span>
                    ) : (
                      until.format(new Date(pending.expires_at))
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={revoke}>
                      <input type="hidden" name="invite" value={pending.id} />
                      <SubmitButton
                        working="Revogando…"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "xs",
                        })}
                      >
                        Revogar
                      </SubmitButton>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
