import Link from "next/link";
import { redirect } from "next/navigation";
import { runScan, type ScanRejection } from "@/packages/scan/scan";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/** A cold start unpacks Chromium before it can open anything. */
export const maxDuration = 60;

/**
 * Why each refusal happened, in words the person can act on.
 *
 * Deliberately plain: none of these is a judgement about the store, and the
 * store not answering is not the shopkeeper's fault.
 */
const REFUSALS: Record<ScanRejection, string> = {
  malformed: "Isso não parece um endereço. Tente algo como loja.com.br",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço. Confira se está escrito certo.",
  "private-address":
    "Esse endereço não é público, então não há o que examinar.",
  unreachable: "A loja não respondeu a tempo. Pode estar fora do ar.",
};

async function examine(rawUrl: string) {
  const scan = await runScan(rawUrl);
  if (!scan.ok) return scan;

  // Recorded with the service role: a scan is a fact our own browser observed,
  // and an anonymous one has no signed-in user to write it.
  await createAdminClient()
    .from("scans")
    .insert({ url: scan.url, cookies: scan.cookies });

  return scan;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const scan = url ? await examine(url) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Veja o que uma loja grava no navegador de quem visita.
        </p>
      </div>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="url"
          required
          defaultValue={url ?? ""}
          placeholder="loja.com.br"
          aria-label="Endereço da loja"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          Examinar
        </button>
      </form>

      {scan && !scan.ok && (
        <p role="alert" className="text-sm text-red-600">
          {REFUSALS[scan.reason]}
        </p>
      )}

      {scan?.ok && <Cookies scan={scan} />}

      <p className="text-sm text-zinc-500">
        {user ? (
          <>
            {user.email} ·{" "}
            <form
              action={async () => {
                "use server";
                const client = await createClient();
                await client.auth.signOut();
                redirect("/");
              }}
              className="inline"
            >
              <button className="underline">Sair</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">
              Entrar
            </Link>{" "}
            para acompanhar suas lojas ao longo do tempo.
          </>
        )}
      </p>
    </main>
  );
}

function Cookies({
  scan,
}: {
  scan: Extract<Awaited<ReturnType<typeof runScan>>, { ok: true }>;
}) {
  if (scan.cookies.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nenhum cookie foi gravado ao abrir {scan.url}.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
        {scan.cookies.length} cookies gravados ao abrir {scan.url}
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
            {scan.cookies.map((cookie) => (
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
