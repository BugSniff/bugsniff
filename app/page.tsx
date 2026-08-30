import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseTargetUrl } from "@/packages/scan/target-url";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";

/** Why a URL was refused, in words the person can act on. */
const REFUSALS: Record<string, string> = {
  malformed: "Isso não parece um endereço. Tente algo como loja.com.br",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço. Confira se está escrito certo.",
  "private-address":
    "Esse endereço não é público, então não há o que examinar.",
};

/**
 * Parks a scan and sends the link that will release it.
 *
 * Nothing expensive happens here on purpose. The URL is checked — cheap, and it
 * catches a typo before costing anyone an e-mail — and then stored against a
 * scan that is explicitly *not* queued. No browser starts until someone clicks
 * a link that arrived in the inbox they claimed.
 *
 * The URL does not travel inside the e-mail: a link the recipient can edit would
 * let them point the scan somewhere else with the gate already passed. The link
 * carries the scan's claim token, and the URL stays in the row.
 */
async function requestScan(formData: FormData) {
  "use server";
  const rawUrl = String(formData.get("url") ?? "");
  const email = String(formData.get("email") ?? "");

  const target = await parseTargetUrl(rawUrl);
  if (!target.ok) {
    redirect(`/?erro=${encodeURIComponent(REFUSALS[target.reason])}`);
  }

  const { data: scan } = await createAdminClient()
    .from("scans")
    .insert({ url: target.url.href })
    .select("claim_token")
    .single();

  if (!scan) {
    redirect(
      `/?erro=${encodeURIComponent("Não conseguimos registrar o exame. Tente de novo.")}`
    );
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?scan=${scan.claim_token}`,
    },
  });

  if (error) redirect(`/?erro=${encodeURIComponent(error.message)}`);
  redirect("/?enviado=1");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string }>;
}) {
  const { erro, enviado } = await searchParams;

  return (
    <main className="mx-auto flex flex-1 w-full max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Veja o que uma loja grava no navegador de quem visita.
        </p>
      </div>

      {enviado ? (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <p role="status" className="text-sm">
            Link enviado. Abra seu e-mail e clique para ver o exame — ele começa
            a rodar quando você clicar.
          </p>
          <Link href="/" className="text-sm text-zinc-500 underline">
            Examinar outra loja
          </Link>
        </div>
      ) : (
        <form action={requestScan} className="flex flex-col gap-3">
          <input
            type="text"
            name="url"
            required
            placeholder="loja.com.br"
            aria-label="Endereço da loja"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            aria-label="Seu e-mail"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <button className="rounded-lg bg-zinc-900 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Examinar
          </button>

          <p className="text-xs text-zinc-500">
            Mandamos o resultado por um link no seu e-mail. Sem senha: o link é
            a sua entrada.
          </p>
        </form>
      )}
    </main>
  );
}
