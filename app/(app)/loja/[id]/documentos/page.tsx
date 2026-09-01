import { IconFilePlus } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { KINDS, type DocumentKind } from "@/packages/document";
import {
  companyFrom,
  missingFrom,
  type Company,
} from "@/packages/document/company";
import { createClient } from "@/packages/supabase/server";
import { generateVersion, saveController } from "./actions";

/**
 * Os documentos desta loja, e quem responde por ela.
 *
 * The company sits on the same screen as the documents it goes into, rather
 * than on a settings page of its own, because it is only ever typed for this
 * reason. Somebody arriving here to generate a policy finds the missing CNPJ
 * in front of them instead of discovering it inside the generated text.
 */

const DAY = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** The form, in the order a person has the answers. */
const FIELDS: { name: keyof Company; label: string; hint?: string }[] = [
  { name: "legalName", label: "Razão social" },
  { name: "cnpj", label: "CNPJ" },
  { name: "address", label: "Endereço da sede" },
  {
    name: "email",
    label: "E-mail de contato",
    hint: "Onde o visitante escreve para exercer os direitos dele.",
  },
  { name: "officer", label: "Encarregado (DPO)" },
  { name: "officerEmail", label: "E-mail do encarregado" },
];

type Version = {
  id: string;
  number: number;
  created_at: string;
  approved_at: string | null;
};

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: store }, { data: controller }, { data: documents }] =
    await Promise.all([
      supabase.from("stores").select("id, host").eq("id", id).maybeSingle(),
      supabase
        .from("controllers")
        .select("details")
        .eq("store_id", id)
        .maybeSingle(),
      supabase
        .from("documents")
        .select(
          "id, kind, document_versions(id, number, created_at, approved_at)"
        )
        .eq("store_id", id),
    ]);

  if (!store) notFound();

  const company = companyFrom(controller?.details);
  const missing = missingFrom(company);

  const versionsOf = (kind: DocumentKind): Version[] =>
    (
      (documents ?? []).find((document) => document.kind === kind)
        ?.document_versions ?? ([] as Version[])
    )
      .slice()
      .sort((a, b) => b.number - a.number);

  return (
    <AppShell
      active="documentos"
      store={id}
      crumbs={
        <>
          <Link href="/painel" className="hover:text-foreground">
            Painel
          </Link>
          <span>/</span>
          <Link
            href={`/loja/${store.id}`}
            className="font-mono hover:text-foreground"
          >
            {store.host}
          </Link>
          <span>/</span>
          <strong className="font-medium text-foreground">Documentos</strong>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Documentos</h1>
        <p className="max-w-[700px] text-sm text-muted-foreground">
          Política de privacidade e termos de uso gerados para esta loja. Cada
          versão é imutável: é a ela que uma revisão jurídica se refere, e é ela
          que fica publicada.
        </p>
      </div>

      <Controller
        storeId={store.id}
        company={company}
        missing={missing.length}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {(Object.keys(KINDS) as DocumentKind[]).map((kind) => (
          <DocumentCard
            key={kind}
            storeId={store.id}
            kind={kind}
            versions={versionsOf(kind)}
          />
        ))}
      </div>
    </AppShell>
  );
}

/**
 * Quem responde pela loja, perguntado uma vez.
 *
 * A plain form and a server action: nothing here needs to react to a keystroke,
 * and a page that ships no JavaScript to collect six strings is a page that
 * loads on the shop owner's phone.
 */
function Controller({
  storeId,
  company,
  missing,
}: {
  storeId: string;
  company: Company;
  missing: number;
}) {
  return (
    <Card className="px-6">
      <form action={saveController} className="flex flex-col gap-5">
        <input type="hidden" name="store" value={storeId} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-medium">Quem responde por esta loja</span>
            <span className="max-w-[560px] text-sm text-muted-foreground">
              O controlador dos dados, na palavra da LGPD. Informado uma vez e
              reaproveitado nos dois documentos — a política precisa dele nos
              artigos 9º e 41, e é isso que o exame cobra da loja.
            </span>
          </div>

          {missing > 0 && (
            <Badge>
              {missing === 1
                ? "1 campo em branco"
                : `${missing} campos em branco`}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ name, label, hint }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} name={name} defaultValue={company[name]} />
              {hint && (
                <span className="text-xs text-muted-foreground">{hint}</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton working="Salvando…" className={buttonVariants()}>
            Salvar
          </SubmitButton>
          <span className="text-xs text-muted-foreground">
            Campo em branco vira <span className="font-mono">[PREENCHER]</span>{" "}
            no documento, à vista. Nada é inventado no lugar dele.
          </span>
        </div>
      </form>
    </Card>
  );
}

/**
 * Um documento e o seu histórico.
 *
 * The history is not decoration either: every version stays readable because a
 * legal review points at one of them, and the row that says "substituída" is
 * how somebody finds the text a lawyer was looking at three months ago.
 */
function DocumentCard({
  storeId,
  kind,
  versions,
}: {
  storeId: string;
  kind: DocumentKind;
  versions: Version[];
}) {
  const current = versions.find(({ approved_at }) => approved_at) ?? null;
  const latest = versions[0] ?? null;

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <span className="font-medium">{KINDS[kind]}</span>
        {current ? (
          <Badge variant="outline">v{current.number} aprovada</Badge>
        ) : latest ? (
          <Badge>v{latest.number} esperando leitura</Badge>
        ) : null}
      </div>

      <p className="px-6 pt-2 text-sm text-muted-foreground">
        {latest
          ? `Gerada em ${DAY.format(new Date(latest.created_at))}.`
          : "Ainda não gerada para esta loja."}
      </p>

      {versions.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Gerada em</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>v{version.number}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {DAY.format(new Date(version.created_at))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {!version.approved_at
                      ? "esperando leitura"
                      : version.id === current?.id
                        ? "aprovada"
                        : "substituída"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/loja/${storeId}/documentos/${kind}/${version.number}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "xs",
                      })}
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <form action={generateVersion} className="px-6 pt-4 pb-5">
        <input type="hidden" name="store" value={storeId} />
        <input type="hidden" name="kind" value={kind} />
        <SubmitButton
          working="Gerando…"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <IconFilePlus size={14} stroke={2} />{" "}
          {versions.length > 0 ? "Gerar versão nova" : "Gerar"}
        </SubmitButton>
      </form>
    </Card>
  );
}
