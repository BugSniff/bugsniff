import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { ScanRejection } from "@/packages/scan/scan";
import { createClient } from "@/packages/supabase/server";
import { Watch } from "./watch";

/** Why a scan came back empty-handed, in words the person can act on. */
const FAILURES: Record<ScanRejection, string> = {
  malformed: "O endereço não pôde ser lido.",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço.",
  "private-address": "Esse endereço não é público.",
  unreachable: "A loja não respondeu a tempo. Pode estar fora do ar.",
};

type Cookie = { name: string; domain: string; expires: number };

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RLS does the authorisation. A scan belonging to another organization is not
  // forbidden here, it is invisible — so there is nothing to leak by asking.
  const supabase = await createClient();
  const { data: scan } = await supabase
    .from("scans")
    .select("id, url, status, cookies, failure")
    .eq("id", id)
    .maybeSingle();

  if (!scan) notFound();

  const waiting = scan.status === "pending" || scan.status === "running";

  // Whoever is waiting is the sweeper.
  //
  // The chain normally hands each scan to the next, but a function that dies
  // mid-scan breaks it and leaves the queue standing still. Rather than a cron
  // sweeping for orphans on a schedule, the person looking at a scan that has
  // not started nudges the queue themselves — which is exactly when it matters
  // and never when it does not. A scan nobody is waiting for can wait.
  if (scan.status === "pending") {
    const origin = (await headers()).get("origin");
    after(() =>
      fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
        // Another visit will try again.
      })
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      {waiting && <Watch scanId={scan.id} />}

      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">{scan.url}</p>
      </div>

      {waiting && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          {scan.status === "running"
            ? "Abrindo a loja num navegador de verdade…"
            : "Na fila. Começa assim que uma vaga abrir."}{" "}
          Esta página se atualiza sozinha.
        </p>
      )}

      {scan.status === "failed" && (
        <p role="alert" className="text-sm text-red-600">
          {FAILURES[scan.failure as ScanRejection] ??
            "O exame não pôde ser concluído."}
        </p>
      )}

      {scan.status === "done" && <Cookies cookies={scan.cookies as Cookie[]} />}

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          Examinar outra loja
        </Link>
      </p>
    </main>
  );
}

function Cookies({ cookies }: { cookies: Cookie[] }) {
  if (cookies.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nenhum cookie foi gravado ao abrir esta loja.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
        {cookies.length} cookies gravados
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Nome
              </th>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Domínio
              </th>
              <th className="border-b border-zinc-200 py-2 font-normal dark:border-zinc-800">
                Duração
              </th>
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie) => (
              <tr key={`${cookie.domain}${cookie.name}`}>
                <td className="border-b border-zinc-100 py-2 pr-4 font-mono text-xs dark:border-zinc-900">
                  {cookie.name}
                </td>
                <td className="border-b border-zinc-100 py-2 pr-4 text-zinc-500 dark:border-zinc-900">
                  {cookie.domain}
                </td>
                <td className="border-b border-zinc-100 py-2 text-zinc-500 dark:border-zinc-900">
                  {cookie.expires === -1
                    ? "até fechar o navegador"
                    : "persistente"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
