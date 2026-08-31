import { IconAlertCircle, IconScan } from "@tabler/icons-react";
import Link from "next/link";
import { requestScan } from "@/app/scan-action";
import { AppShell } from "@/components/app-shell";
import { storeName } from "@/lib/store";
import { Mark } from "@/components/brand";
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
import { scanRefusal } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { namedTrackers, type Tracker } from "@/packages/tracker";
import { createClient } from "@/packages/supabase/server";

/** What the person lands on after the link in their inbox. */
type Row = {
  id: string;
  url: string;
  status: string;
  consent_banner: ConsentBannerState | null;
  cookies: { name: string; phase?: ConsentPhase }[] | null;
  requests: { host: string; phase?: ConsentPhase }[] | null;
  created_at: string;
};

/** How the banner reads in a table, in the words the scan may honestly use. */
const BANNER: Record<ConsentBannerState, string> = {
  accepted: "aceito",
  "not-found": "não encontrado",
  unrecognised: "não reconhecido",
};

const inPhase = (row: Row, phase: ConsentPhase) => ({
  cookies: (row.cookies ?? []).filter((c) => c.phase === phase),
  requests: (row.requests ?? []).filter((r) => r.phase === phase),
});

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  // RLS scopes both of these to the caller's own organizations, so there is
  // nothing to filter by here and nothing to leak by asking.
  const supabase = await createClient();
  const [{ data: scans }, { data: trackers }, { data: organization }] =
    await Promise.all([
      supabase
        .from("scans")
        .select(
          "id, url, status, consent_banner, cookies, requests, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
      supabase.from("organizations").select("name").maybeSingle(),
    ]);

  const rows = (scans ?? []) as Row[];

  return (
    <AppShell
      active="/painel"
      crumbs={<strong className="font-medium text-foreground">Painel</strong>}
    >
      {rows.length === 0 ? (
        <FirstStore erro={erro} />
      ) : (
        <Exams
          rows={rows}
          trackers={(trackers ?? []) as Tracker[]}
          organization={organization?.name ?? "Painel"}
          erro={erro}
        />
      )}
    </AppShell>
  );
}

/**
 * The organization exists and has never examined anything.
 *
 * Which is the state every account starts in, because the organization is
 * created by the click on the magic link — so this is the first screen of the
 * product for everyone who did not arrive with a store already parked.
 */
function FirstStore({ erro }: { erro?: string }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
          Bem-vindo ao bugsniff
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua organização foi criada quando você clicou no link. Falta a
          primeira loja.
        </p>
      </div>

      <Card className="items-center gap-5 px-6 py-14 text-center">
        <Mark size="lg" className="size-12 rounded-2xl">
          <IconScan size={24} stroke={2} />
        </Mark>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-medium">Examine a primeira loja</h2>
          <p className="max-w-[420px] text-sm text-muted-foreground">
            Cole o endereço e o exame começa na hora. Não precisa conectar nada,
            instalar nada, nem falar com ninguém.
          </p>
        </div>

        <form action={requestScan} className="flex w-[440px] flex-col gap-2">
          <input type="hidden" name="voltar" value="/painel" />
          <div className="flex gap-2">
            <Label htmlFor="url" className="sr-only">
              Endereço da loja
            </Label>
            <Input id="url" name="url" required placeholder="loja.com.br" />
            <SubmitButton working="Começando…" className={buttonVariants()}>
              Examinar
            </SubmitButton>
          </div>
          {erro && <Refusal code={erro} />}
        </form>
      </Card>

      <div className="flex flex-col gap-5 md:flex-row">
        {NEXT.map(({ title, body }) => (
          <Card key={title} size="sm" className="flex-1 gap-2 px-4">
            <h2 className="text-sm text-muted-foreground">{title}</h2>
            <p className="text-sm">{body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

const NEXT = [
  {
    title: "Depois do primeiro exame",
    body: "Você vê o que a loja gravou antes de perguntar qualquer coisa, com o nome de cada serviço.",
  },
  {
    title: "Documentos",
    body: "A política de privacidade sai da leitura da sua loja, citando os serviços que ela realmente usa.",
  },
  {
    title: "Banner",
    body: "A lista de bloqueio nasce do exame: são os rastreadores encontrados nesta loja, não uma lista genérica.",
  },
] as const;

/** Everything this organization has examined, most recent first. */
function Exams({
  rows,
  trackers,
  organization,
  erro,
}: {
  rows: Row[];
  trackers: Tracker[];
  /** The organization's own name, which is what the page is about. */
  organization: string;
  erro?: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
            {organization}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 1 ? "1 exame" : `${rows.length} exames`}
          </p>
        </div>

        <form action={requestScan} className="flex items-start gap-2">
          <input type="hidden" name="voltar" value="/painel" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Label htmlFor="url" className="sr-only">
                Endereço da loja
              </Label>
              <Input
                id="url"
                name="url"
                required
                placeholder="loja.com.br"
                className="w-56"
              />
              <SubmitButton working="Começando…" className={buttonVariants()}>
                Novo exame
              </SubmitButton>
            </div>
            {erro && <Refusal code={erro} />}
          </div>
        </form>
      </div>

      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-1 px-6 py-5">
          <span className="font-heading text-base font-medium">
            Exames recentes
          </span>
          <span className="text-xs text-muted-foreground">
            O que cada loja acionou antes de perguntar qualquer coisa
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Banner</TableHead>
                <TableHead>Antes do consentimento</TableHead>
                <TableHead>Depois</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <ExamRow key={row.id} row={row} trackers={trackers} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}

/**
 * One scan, in five columns.
 *
 * A scan that failed is not a store with nothing to report. It gets its own
 * mark and no counts at all, because "nenhum rastreador" about a page that was
 * never the store is the most flattering possible way to be wrong (#34).
 */
function ExamRow({ row, trackers }: { row: Row; trackers: Tracker[] }) {
  const done = row.status === "done";
  const failed = row.status === "failed";

  const before = done
    ? namedTrackers(inPhase(row, "pre-consent"), trackers)
    : [];
  const after = done
    ? namedTrackers(inPhase(row, "post-consent"), trackers)
    : [];

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{storeName(row.url)}</TableCell>

      <TableCell>
        {done && row.consent_banner ? (
          <Badge variant="outline">{BANNER[row.consent_banner]}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        {!done ? (
          <span className="text-muted-foreground">—</span>
        ) : before.length === 0 ? (
          <span className="text-muted-foreground">nenhum</span>
        ) : (
          <Badge>
            {before.length === 1
              ? "1 rastreador"
              : `${before.length} rastreadores`}
          </Badge>
        )}
      </TableCell>

      <TableCell className="text-muted-foreground tabular-nums">
        {done ? after.length : "—"}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {timeAgo(row.created_at)}
      </TableCell>

      <TableCell className="text-right">
        {failed ? (
          <Badge variant="destructive">
            <IconAlertCircle size={12} stroke={2} /> não medido
          </Badge>
        ) : (
          <Link
            href={`/exame/${row.id}`}
            className={buttonVariants({ variant: "ghost", size: "xs" })}
          >
            {done ? "Abrir" : "Acompanhar"}
          </Link>
        )}
      </TableCell>
    </TableRow>
  );
}

function Refusal({ code }: { code: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {scanRefusal(code)}
    </p>
  );
}
