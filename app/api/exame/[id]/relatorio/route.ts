import { ReportPaper } from "@/components/report-paper";
import { reportOf, type Reported } from "@/lib/report";
import { evidenceImage, REPORT_COLUMNS } from "@/lib/report-source";
import { openBrowser } from "@/packages/scan/browser";
import { createClient } from "@/packages/supabase/server";
import type { Tracker } from "@/packages/tracker";

/** A cold start unpacks Chromium before it can print anything. */
export const maxDuration = 60;

/** Web fonts the paper asks for, so the file does not fall back to Times. */
const FONTS =
  "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&family=Noto+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";

/**
 * The report as a file.
 *
 * The same component the screen shows, rendered to a string and handed to the
 * browser we already ship for the scan — so the preview and the file are the
 * same document by construction rather than by discipline.
 *
 * This route opens Chromium, which means it has to be named in
 * `outputFileTracingIncludes` or it ships without the binary and dies in
 * production with "cannot find module" (ADR-0002). The build will not tell you.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // The caller's own session, so RLS answers this the same way it answers the
  // screen: a scan belonging to another organization is invisible, not
  // forbidden. Nothing here runs with the service role.
  const supabase = await createClient();
  const [{ data: scan }, { data: trackers }] = await Promise.all([
    supabase.from("scans").select(REPORT_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
  ]);

  if (!scan || scan.status !== "done") {
    return new Response(null, { status: 404 });
  }

  const report = reportOf(
    scan as unknown as Reported,
    (trackers ?? []) as Tracker[]
  );
  const banner = await evidenceImage(supabase, scan.evidence_pre_path);

  // Imported here rather than at the top of the file: Next refuses a static
  // import of `react-dom/server` from the app router, and it is right to for a
  // component — but this is not rendering a page, it is rendering a document to
  // hand to a printer.
  const { renderToStaticMarkup } = await import("react-dom/server");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>body { margin: 0; background: #fff; }</style>
</head><body>${renderToStaticMarkup(ReportPaper({ report, banner }))}</body></html>`;

  const browser = await openBrowser();
  try {
    const page = await browser.newPage();
    // The screenshot is already a data URI, so the only thing on the wire is
    // the stylesheet — but a report that prints in Times because a font server
    // was slow is a report nobody wants to send anyone.
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        // `inline`, not `attachment`: the browser opens it, and whoever wants
        // the file saves it from there. The name is what they get.
        "content-disposition": `inline; filename="bugsniff-${report.store}-${report.at.toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
