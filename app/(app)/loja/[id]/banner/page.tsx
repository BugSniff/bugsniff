import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NewScan } from "@/components/new-scan";
import { Badge } from "@/components/ui/badge";
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
  blocklistFrom,
  type Blocklist,
  type PurposefulTracker,
} from "@/packages/consent-banner/blocklist";
import { settingsFrom } from "@/packages/consent-banner/settings";
import { createClient } from "@/packages/supabase/server";
import { BannerStudio } from "./banner-studio";

/**
 * The screen where the audit stops describing and starts fixing.
 *
 * Everything else in this product reports. This page hands somebody code that
 * changes what their store does to visitors, which is a different kind of
 * promise, and the page is built around keeping it honest: the list is the one
 * the reading produced, the preview runs the same code that gets installed, and
 * what the banner cannot do is written next to what it can.
 */

const when = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
});

/** What each purpose is called on our own screen. */
const PURPOSES: Record<string, string> = {
  analytics: "medição de audiência",
  marketing: "publicidade",
};

export default async function BannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RLS does the authorisation, here as everywhere: a store belonging to
  // another organization is not forbidden, it is invisible.
  const supabase = await createClient();
  const [
    { data: store },
    { data: readings },
    { data: trackers },
    { data: own },
  ] = await Promise.all([
    supabase.from("stores").select("id, host").eq("id", id).maybeSingle(),
    supabase
      .from("scans")
      .select("id, cookies, requests, created_at")
      .eq("store_id", id)
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("trackers")
      .select("name, cookie_pattern, host_pattern, purpose"),
    supabase
      .from("consent_banners")
      .select("settings")
      .eq("store_id", id)
      .maybeSingle(),
  ]);

  if (!store) notFound();

  const latest = readings?.[0];

  // Derived here and never stored, so the tracker table as it stands today is
  // what the code generated today blocks — the same reason the report names
  // trackers at read time.
  const blocklist = blocklistFrom(
    {
      cookies: (latest?.cookies ?? []) as { name: string }[],
      requests: (latest?.requests ?? []) as { host: string }[],
    },
    (trackers ?? []) as PurposefulTracker[]
  );

  return (
    <AppShell
      active="banner"
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
          <strong className="font-medium text-foreground">Banner</strong>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Banner de consentimento</h1>
        <p className="max-w-[700px] text-sm text-muted-foreground">
          O banner é o que impede o rastreador de disparar antes da resposta. É
          também o que o próximo exame vai medir: se ele funciona, a leitura
          pré-consentimento fica vazia.
        </p>
      </div>

      {!latest ? (
        <NoReading host={store.host} storeId={store.id} />
      ) : (
        <>
          <BlocklistCard
            blocklist={blocklist}
            readAt={latest.created_at as string}
          />

          <BannerStudio
            storeId={store.id}
            host={store.host}
            blocklist={blocklist}
            settings={settingsFrom(own?.settings)}
          />
        </>
      )}
    </AppShell>
  );
}

/**
 * A store nobody has read yet, which is a store we have nothing to say about.
 *
 * No code is offered here. A banner generated from no reading would block
 * nothing while looking like protection, and handing that over is worse than
 * handing over nothing.
 */
function NoReading({ host, storeId }: { host: string; storeId: string }) {
  return (
    <Card className="max-w-[700px] gap-4 px-6">
      <p className="text-sm">
        O banner é gerado a partir de um exame desta loja, e ainda não há um
        exame concluído para <span className="font-mono">{host}</span>.
      </p>
      <p className="text-sm text-muted-foreground">
        Sem leitura não há lista de bloqueio: um banner que não sabe o que
        bloquear pergunta sem impedir nada, e é pior do que não ter banner —
        parece proteção.
      </p>
      <NewScan
        label="Examinar agora"
        voltar={`/loja/${storeId}`}
        url={host}
        className="max-w-sm"
      />
    </Card>
  );
}

/**
 * The list, with the rows that are not blocked shown alongside the ones that
 * are.
 *
 * Three states in one table on purpose. "Bloqueado" is only meaningful next to
 * "liberado" and "nunca bloqueado" — a table showing only what we hold back
 * would let the merchant assume the rest was examined and cleared, when the
 * truth is that one row is the shop's own plumbing and the other is a third
 * party we could not put a name to.
 */
function BlocklistCard({
  blocklist,
  readAt,
}: {
  blocklist: Blocklist;
  readAt: string;
}) {
  const { blocked, essential, unnamed } = blocklist;

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Lista de bloqueio</span>
          <span className="text-sm text-muted-foreground">
            Não foi inventada: são os rastreadores que o exame de{" "}
            {when.format(new Date(readAt))} encontrou nesta loja.
          </span>
        </div>
        {blocked.length > 0 && (
          <Badge>
            {blocked.length === 1
              ? "1 rastreador bloqueado"
              : `${blocked.length} rastreadores bloqueados`}
          </Badge>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rastreador</TableHead>
              <TableHead>Como aparece</TableHead>
              <TableHead>Finalidade</TableHead>
              <TableHead>Até a pessoa responder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocked.map(({ name, purpose, cookie, host }) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {[cookie, host].filter(Boolean).join(" · ")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {PURPOSES[purpose] ?? purpose}
                </TableCell>
                <TableCell>
                  <Badge>bloqueado</Badge>
                </TableCell>
              </TableRow>
            ))}

            {unnamed.map((domain) => (
              <TableRow key={domain}>
                <TableCell className="text-muted-foreground">
                  {domain}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {domain}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  não sabemos nomear
                </TableCell>
                <TableCell>
                  <Badge variant="outline">liberado</Badge>
                </TableCell>
              </TableRow>
            ))}

            {essential.map((name) => (
              <TableRow key={name}>
                <TableCell className="text-muted-foreground">{name}</TableCell>
                <TableCell className="text-muted-foreground" />
                <TableCell className="text-muted-foreground">
                  necessário para a loja funcionar
                </TableCell>
                <TableCell>
                  <Badge variant="outline">nunca bloqueado</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 px-6 pt-4 pb-5 text-xs text-muted-foreground">
        <p className="max-w-[720px]">
          O que faz a loja funcionar — sessão, carrinho, token de formulário —
          não entra na lista. Bloquear esses quebraria a loja, e eles não
          dependem de consentimento.
        </p>
        {unnamed.length > 0 && (
          <p className="max-w-[720px]">
            Os terceiros que não sabemos nomear ficam liberados. Bloquear um
            endereço que pode ser o meio de pagamento ou o cálculo de frete
            quebraria a loja por um chute — e a lacuna é nossa, não da loja.
          </p>
        )}
      </div>
    </Card>
  );
}
