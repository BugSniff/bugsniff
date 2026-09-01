import { IconAlertCircle, IconScan } from "@tabler/icons-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Mark } from "@/components/brand";
import { NewScan } from "@/components/new-scan";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  failureShort,
  summarise,
  trackersIn,
  type Exam,
  type StoreSummary,
} from "@/lib/exams";
import { timeAgo } from "@/lib/time";
import type { ConsentBannerState } from "@/packages/scan/scan";
import { createClient } from "@/packages/supabase/server";
import type { Tracker } from "@/packages/tracker";

/** How the banner reads in a table, in the words the scan may honestly use. */
const BANNER: Record<ConsentBannerState, string> = {
  accepted: "aceito",
  "not-found": "não encontrado",
  unrecognised: "não reconhecido",
};

/**
 * How many readings to fetch to work out where each store stands.
 *
 * ponytail: every reading of the organization, grouped in memory, because at
 * a few dozen scans that is one query instead of one per store. The moment an
 * agency with forty shops has a year of weekly readings this is two thousand
 * rows to summarise five, and the answer is a view that returns the latest per
 * store — not a bigger limit.
 */
const READINGS = 500;

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  // RLS scopes all of these to the caller's own organizations, so there is
  // nothing to filter by here and nothing to leak by asking.
  const supabase = await createClient();
  const [{ data: stores }, { data: exams }, { data: trackers }, { data: org }] =
    await Promise.all([
      supabase.from("stores").select("id, host"),
      supabase
        .from("scans")
        .select(
          "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id, failure"
        )
        .order("created_at", { ascending: false })
        .limit(READINGS),
      supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
      supabase.from("organizations").select("name").maybeSingle(),
    ]);

  const summary = summarise(stores ?? [], (exams ?? []) as Exam[]);

  return (
    <AppShell
      active="/painel"
      crumbs={<strong className="font-medium text-foreground">Painel</strong>}
    >
      {summary.length === 0 ? (
        <FirstStore erro={erro} />
      ) : (
        <Stores
          stores={summary}
          trackers={(trackers ?? []) as Tracker[]}
          organization={org?.name ?? "Painel"}
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

        <NewScan erro={erro} label="Examinar" className="w-[440px]" />
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

/**
 * The stores this organization audits, newest reading first.
 *
 * Stores, not readings. A store examined five times is one shop with a
 * history, and a list that repeats it five times cannot say a single true
 * sentence about how it changed.
 */
function Stores({
  stores,
  trackers,
  organization,
  erro,
}: {
  stores: StoreSummary[];
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
            {stores.length === 1 ? "1 loja" : `${stores.length} lojas`}
          </p>
        </div>

        <NewScan erro={erro} label="Novo exame" />
      </div>

      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-1 px-6 py-5">
          <span className="font-heading text-base font-medium">Lojas</span>
          <span className="text-xs text-muted-foreground">
            O que cada loja acionou antes de perguntar qualquer coisa
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Exames</TableHead>
                <TableHead>Banner</TableHead>
                <TableHead>Antes do consentimento</TableHead>
                <TableHead>Último exame</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <StoreRow key={store.id} store={store} trackers={trackers} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}

/**
 * One store, as its most recent reading leaves it.
 *
 * A reading that did not happen gets its own mark and no counts at all,
 * because "nenhum rastreador" about a page that was never the store is the
 * most flattering possible way to be wrong (#34).
 */
function StoreRow({
  store,
  trackers,
}: {
  store: StoreSummary;
  trackers: Tracker[];
}) {
  const { latest } = store;
  const done = latest.status === "done";
  const failed = latest.status === "failed";
  const before = trackersIn(latest, "pre-consent", trackers);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{store.host}</TableCell>

      <TableCell className="text-muted-foreground tabular-nums">
        {store.exams}
      </TableCell>

      <TableCell>
        {done && latest.consent_banner ? (
          <Badge variant="outline">{BANNER[latest.consent_banner]}</Badge>
        ) : failed ? (
          // O motivo junto do selo, e não só o selo. Quem abre o painel e vê
          // uma loja que não mediu precisa saber ali se ela estava fora do ar
          // ou se ela barrou o nosso navegador — são atendimentos diferentes.
          <div className="flex flex-col gap-1">
            <Badge variant="destructive">
              <IconAlertCircle size={12} stroke={2} /> não medido
            </Badge>
            <span className="text-xs text-muted-foreground">
              {failureShort(latest.failure)}
            </span>
          </div>
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

      <TableCell className="text-xs text-muted-foreground">
        {timeAgo(latest.created_at)}
      </TableCell>

      <TableCell className="text-right">
        <Link
          href={`/loja/${store.id}`}
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          Abrir
        </Link>
      </TableCell>
    </TableRow>
  );
}
