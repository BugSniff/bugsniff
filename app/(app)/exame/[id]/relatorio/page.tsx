import { IconFileText } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ReportPaper } from "@/components/report-paper";
import { buttonVariants } from "@/components/ui/button";
import { reportOf, type Reported } from "@/lib/report";
import { evidenceImage, REPORT_COLUMNS } from "@/lib/report-source";
import { createClient } from "@/packages/supabase/server";
import type { Tracker } from "@/packages/tracker";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RLS does the authorisation. A scan belonging to another organization is not
  // forbidden here, it is invisible — so there is nothing to leak by asking.
  const supabase = await createClient();
  const [{ data: scan }, { data: trackers }] = await Promise.all([
    supabase.from("scans").select(REPORT_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
  ]);

  // A reading that did not happen has nothing to report, and a report built
  // from it would state numbers about a page that was never the store (#34).
  if (!scan || scan.status !== "done") notFound();

  const report = reportOf(
    scan as unknown as Reported,
    (trackers ?? []) as Tracker[]
  );
  const banner = await evidenceImage(supabase, scan.evidence_pre_path);

  return (
    <AppShell
      active="/painel"
      crumbs={
        <>
          <Link href="/painel" className="hover:text-foreground">
            Painel
          </Link>
          <span>/</span>
          <Link
            href={`/exame/${id}`}
            className="font-mono hover:text-foreground"
          >
            {report.store}
          </Link>
          <span>/</span>
          <strong className="font-medium text-foreground">Relatório</strong>
        </>
      }
      actions={
        <a
          href={`/api/exame/${id}/relatorio`}
          className={buttonVariants({ size: "sm" })}
        >
          <IconFileText size={14} stroke={2} /> Baixar PDF
        </a>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
          Relatório de{" "}
          {report.at.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerado a partir da leitura das{" "}
          {report.at.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Um relatório é uma leitura congelada: reexaminar a loja cria outro,
          não altera este.
        </p>
      </div>

      {/* The preview is the document itself, not a rendering of it — the same
          component the PDF route prints. There is nothing here that can be
          true on screen and false in the file. */}
      <div className="overflow-x-auto rounded-2xl bg-muted p-8">
        <ReportPaper report={report} banner={banner} />
      </div>
    </AppShell>
  );
}
