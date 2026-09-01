import { IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DocumentBody } from "@/components/document-body";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { changedParts, diffCount, diffLines, type DiffLine } from "@/lib/diff";
import { KINDS, type DocumentKind } from "@/packages/document";
import { missingFrom, companyFrom } from "@/packages/document/company";
import { createClient } from "@/packages/supabase/server";
import { approveVersion } from "../../actions";

/**
 * Uma versão, do jeito que ela vai ficar, e o que mudou desde a anterior.
 *
 * The screen where a person takes responsibility for a legal document about
 * their own company. Everything on it serves that: the whole text, because
 * approving something one has only seen summarised is not approving it; the
 * diff, because the second version onwards nobody rereads forty paragraphs;
 * and the gaps, counted out loud, because a document that still says
 * `[PREENCHER]` is not one anybody should be putting on a storefront.
 */

const DAY = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function VersionPage({
  params,
}: {
  params: Promise<{ id: string; kind: string; number: string }>;
}) {
  const { id, kind, number } = await params;

  if (kind !== "privacy_policy" && kind !== "terms_of_use") notFound();

  const supabase = await createClient();

  // RLS resolves a version back through its document to the store, so a version
  // of another organization is not forbidden here — it is invisible.
  const [{ data: store }, { data: document }] = await Promise.all([
    supabase.from("stores").select("id, host").eq("id", id).maybeSingle(),
    supabase
      .from("documents")
      .select(
        "id, kind, document_versions(id, number, body, company, scan_id, created_at, approved_at)"
      )
      .eq("store_id", id)
      .eq("kind", kind)
      .maybeSingle(),
  ]);

  if (!store || !document) notFound();

  const versions = (document.document_versions ?? [])
    .slice()
    .sort((a, b) => a.number - b.number);

  const at = versions.findIndex((v) => String(v.number) === number);
  if (at === -1) notFound();

  const version = versions[at];
  const previous = at > 0 ? versions[at - 1] : null;
  const approved = versions.filter((v) => v.approved_at);
  const current = approved[approved.length - 1] ?? null;

  const missing = missingFrom(companyFrom(version.company)).length;
  const changes = previous
    ? diffLines(previous.body as string, version.body as string)
    : [];

  return (
    <AppShell
      active="documentos"
      store={id}
      crumbs={
        <>
          <Link
            href={`/loja/${store.id}/documentos`}
            className="hover:text-foreground"
          >
            Documentos
          </Link>
          <span>/</span>
          <span>{KINDS[kind as DocumentKind]}</span>
          <span>/</span>
          <strong className="font-medium text-foreground">
            v{version.number}
          </strong>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">
          {KINDS[kind as DocumentKind]}, v{version.number}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">imutável</Badge>
          <span>gerada em {DAY.format(new Date(version.created_at))}</span>
          {version.approved_at && (
            <>
              <span>·</span>
              <span>
                {version.id === current?.id
                  ? "aprovada e em vigor"
                  : "aprovada, depois substituída"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <Card className="min-w-0 flex-1 px-8 py-7">
          <DocumentBody body={version.body as string} />
        </Card>

        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
          <Approval
            storeId={store.id}
            versionId={version.id as string}
            approvedAt={version.approved_at as string | null}
            missing={missing}
          />

          <Card className="gap-2 px-6" data-size="sm">
            <span className="font-medium">De onde veio</span>
            <p className="text-sm text-muted-foreground">
              Os serviços citados no texto vieram da leitura desta loja, não de
              uma lista genérica.
            </p>
            {version.scan_id ? (
              <Link
                href={`/exame/${version.scan_id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Ver o exame
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                O exame que originou esta versão não está mais guardado. O texto
                continua, porque a versão é imutável.
              </p>
            )}
          </Card>

          <Changes changes={changes} from={previous?.number ?? null} />
        </div>
      </div>
    </AppShell>
  );
}

/**
 * A leitura obrigatória, e o que a impede.
 *
 * A document still carrying `[PREENCHER]` cannot be approved, and the button
 * says why rather than being mysteriously absent. The rule is not bureaucracy:
 * the blank is where the company's own name or CNPJ goes, and a policy that
 * names nobody as controller fails the article the audit quotes at the store.
 */
function Approval({
  storeId,
  versionId,
  approvedAt,
  missing,
}: {
  storeId: string;
  versionId: string;
  approvedAt: string | null;
  missing: number;
}) {
  if (approvedAt) {
    return (
      <Card className="gap-2 px-6" data-size="sm">
        <span className="flex items-center gap-2 font-medium">
          <IconCheck size={16} stroke={2.5} className="text-muted-foreground" />
          Lida e aprovada
        </span>
        <p className="text-sm text-muted-foreground">
          Em {DAY.format(new Date(approvedAt))}. O texto não muda mais: gerar de
          novo cria outra versão, e esta continua sendo a que alguém leu.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-3 bg-primary/10 px-6" data-size="sm">
      <span className="font-medium">Esperando a sua leitura</span>

      {missing > 0 ? (
        <p className="text-sm text-muted-foreground">
          Este texto ainda tem{" "}
          {missing === 1 ? "um campo em branco" : `${missing} campos em branco`}
          . Preencha os dados da empresa e gere uma versão nova — aprovar um
          documento que diz <span className="font-mono">[PREENCHER]</span> no
          lugar do controlador não ajuda ninguém.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nada é publicado por conta própria. Leia o texto ao lado: ele fala em
          nome da sua empresa, e quem responde por ele é você.
        </p>
      )}

      <form action={approveVersion}>
        <input type="hidden" name="store" value={storeId} />
        <input type="hidden" name="version" value={versionId} />
        <SubmitButton
          working="Registrando…"
          className={buttonVariants({
            className: missing > 0 ? "pointer-events-none opacity-50" : "",
          })}
        >
          Li e aprovo esta versão
        </SubmitButton>
      </form>

      {missing > 0 && (
        <Link
          href={`/loja/${storeId}/documentos`}
          className="text-xs text-muted-foreground underline"
        >
          Preencher os dados da empresa
        </Link>
      )}
    </Card>
  );
}

/** O que mudou desde a versão anterior, e só isso. */
function Changes({
  changes,
  from,
}: {
  changes: DiffLine[];
  from: number | null;
}) {
  if (from === null) {
    return (
      <Card className="gap-2 px-6" data-size="sm">
        <span className="font-medium">Primeira versão</span>
        <p className="text-sm text-muted-foreground">
          Não há nada com que comparar ainda. A partir da próxima, esta caixa
          mostra o que mudou.
        </p>
      </Card>
    );
  }

  const { added, removed } = diffCount(changes);
  const parts = changedParts(changes);

  return (
    <Card className="gap-3 px-6" data-size="sm">
      <span className="font-medium">O que mudou desde a v{from}</span>

      {parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nada. O texto saiu igual ao da versão anterior — a loja e os dados da
          empresa não mudaram entre as duas gerações.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {added === 0
              ? ""
              : `${added} ${added === 1 ? "linha entrou" : "linhas entraram"}`}
            {added > 0 && removed > 0 ? ", " : ""}
            {removed === 0
              ? ""
              : `${removed} ${removed === 1 ? "linha saiu" : "linhas saíram"}`}
            .
          </p>

          <div className="flex flex-col gap-3 overflow-x-auto font-mono text-[11px] leading-relaxed">
            {parts.map((part, index) => (
              <pre key={index} className="flex flex-col">
                {part.map((line, at) => (
                  <span
                    key={at}
                    className={
                      line.kind === "added"
                        ? "bg-primary/15 text-foreground"
                        : line.kind === "removed"
                          ? "text-muted-foreground line-through decoration-muted-foreground/40"
                          : "text-muted-foreground/70"
                    }
                  >
                    {line.kind === "added"
                      ? "+ "
                      : line.kind === "removed"
                        ? "- "
                        : "  "}
                    {line.text || " "}
                  </span>
                ))}
              </pre>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
