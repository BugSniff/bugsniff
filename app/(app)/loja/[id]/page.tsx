import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
import { trackersIn, type Exam } from "@/lib/exams";
import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { createClient } from "@/packages/supabase/server";
import type { Tracker } from "@/packages/tracker";

const BANNER: Record<ConsentBannerState, string> = {
  accepted: "aceito",
  "not-found": "não encontrado",
  unrecognised: "não reconhecido",
};

/** What the scan could say about the store's own published policy. */
const POLICY: Record<string, string> = {
  found: "encontrada",
  "not-found": "não encontrada",
  unreadable: "não lida",
};

const when = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const count = (exam: Exam, phase: ConsentPhase, of: "cookies" | "requests") =>
  (exam[of] ?? []).filter((item) => item.phase === phase).length;

export default async function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RLS does the authorisation. A store belonging to another organization is
  // not forbidden here, it is invisible — so there is nothing to leak by asking.
  const supabase = await createClient();
  const [{ data: store }, { data: exams }, { data: trackers }] =
    await Promise.all([
      supabase.from("stores").select("id, host").eq("id", id).maybeSingle(),
      supabase
        .from("scans")
        .select(
          "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id"
        )
        .eq("store_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
    ]);

  if (!store) notFound();

  const readings = (exams ?? []) as Exam[];

  return (
    <AppShell
      active="/painel"
      crumbs={
        <>
          <Link href="/painel" className="hover:text-foreground">
            Painel
          </Link>
          <span>/</span>
          <strong className="font-mono font-medium text-foreground">
            {store.host}
          </strong>
        </>
      }
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-xl font-semibold">{store.host}</h1>
          <p className="text-sm text-muted-foreground">
            Cada exame é uma leitura desta loja num instante. Nada é recalculado
            depois: o que está aqui é o que o navegador viu naquele dia.
          </p>
        </div>

        <NewScan
          label="Examinar de novo"
          voltar={`/loja/${store.id}`}
          url={store.host}
        />
      </div>

      <Card className="gap-0 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Banner</TableHead>
                <TableHead>Cookies antes</TableHead>
                <TableHead>Terceiros antes</TableHead>
                <TableHead>Rastreadores nomeados</TableHead>
                <TableHead>Política</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((exam) => (
                <ExamRow
                  key={exam.id}
                  exam={exam}
                  trackers={(trackers ?? []) as Tracker[]}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Um exame guarda os prints por 7 dias. Depois disso a leitura continua, a
        imagem não.
      </p>
    </AppShell>
  );
}

/**
 * One reading of this store.
 *
 * A reading that did not happen shows nothing in any column: numbers about a
 * page that was never the store would read as a clean result (#34).
 */
function ExamRow({ exam, trackers }: { exam: Exam; trackers: Tracker[] }) {
  const done = exam.status === "done";
  const failed = exam.status === "failed";
  const named = trackersIn(exam, "pre-consent", trackers);

  const nothing = <span className="text-muted-foreground">—</span>;

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {when.format(new Date(exam.created_at))}
      </TableCell>

      <TableCell>
        {done && exam.consent_banner ? (
          <Badge variant="outline">{BANNER[exam.consent_banner]}</Badge>
        ) : (
          nothing
        )}
      </TableCell>

      <TableCell className="tabular-nums">
        {done ? count(exam, "pre-consent", "cookies") : nothing}
      </TableCell>

      <TableCell className="tabular-nums">
        {done ? count(exam, "pre-consent", "requests") : nothing}
      </TableCell>

      <TableCell>
        {!done ? (
          nothing
        ) : named.length === 0 ? (
          <span className="text-muted-foreground">nenhum</span>
        ) : (
          <Badge>{named.length}</Badge>
        )}
      </TableCell>

      <TableCell>
        {done && exam.policy_state ? (
          <Badge variant="outline">
            {POLICY[exam.policy_state] ?? exam.policy_state}
          </Badge>
        ) : (
          nothing
        )}
      </TableCell>

      <TableCell className="text-right">
        {failed ? (
          <Badge variant="destructive">
            <IconAlertCircle size={12} stroke={2} /> não medido
          </Badge>
        ) : (
          <div className="flex justify-end gap-1">
            {done && (
              <Link
                href={`/exame/${exam.id}/relatorio`}
                className={buttonVariants({ variant: "ghost", size: "xs" })}
              >
                Relatório
              </Link>
            )}
            <Link
              href={`/exame/${exam.id}`}
              className={buttonVariants({ variant: "ghost", size: "xs" })}
            >
              {done ? "Abrir" : "Acompanhar"}
            </Link>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
