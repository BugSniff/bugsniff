import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { parseTargetUrl } from "@/packages/scan/target-url";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";
import { SubmitButton } from "./submit-button";

/** Why a URL was refused, in words the person can act on. */
const REFUSALS: Record<string, string> = {
  malformed: "Isso não parece um endereço. Tente algo como loja.com.br",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço. Confira se está escrito certo.",
  "private-address":
    "Esse endereço não é público, então não há o que examinar.",
};

const NOT_RECORDED = "Não conseguimos registrar o exame. Tente de novo.";

/** Nudges the queue after the response is sent, so nobody waits on a browser. */
async function kickQueue() {
  const origin = (await headers()).get("origin");
  after(() =>
    fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
      // The waiting screen tries again on its next render.
    })
  );
}

/**
 * Starts a scan.
 *
 * Two paths, and the only difference is whether the gate still has anything to
 * prove. The gate exists to establish that whoever asked owns the address they
 * typed — and a live session already established exactly that. Asking again is
 * friction that also spends a magic link to reconfirm something confirmed.
 *
 * Signed in, the scan is queued at once and the person goes straight to it.
 * Signed out, the scan is parked and clicking the link in the inbox releases it.
 */
async function requestScan(formData: FormData) {
  "use server";

  const target = await parseTargetUrl(String(formData.get("url") ?? ""));
  if (!target.ok) {
    redirect(`/?erro=${encodeURIComponent(REFUSALS[target.reason])}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // RLS scopes this to the caller, so it is always their own.
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .maybeSingle();

    if (!organization) {
      redirect(
        `/?erro=${encodeURIComponent("Sua conta não está ligada a nenhuma organização.")}`
      );
    }

    const { data: scan } = await createAdminClient()
      .from("scans")
      .insert({
        url: target.url.href,
        organization_id: organization.id,
        status: "pending",
        pending_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!scan) redirect(`/?erro=${encodeURIComponent(NOT_RECORDED)}`);

    await kickQueue();
    redirect(`/exame/${scan.id}`);
  }

  // Nobody signed in: park the URL and let the inbox release it. The URL does
  // not travel inside the e-mail — a link the recipient could edit would point
  // the scan elsewhere with the gate already passed — so the link carries the
  // claim token and the URL stays in the row.
  const { data: parked } = await createAdminClient()
    .from("scans")
    .insert({ url: target.url.href })
    .select("claim_token")
    .single();

  if (!parked) redirect(`/?erro=${encodeURIComponent(NOT_RECORDED)}`);

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email: String(formData.get("email") ?? ""),
    options: {
      emailRedirectTo: `${origin}/auth/callback?scan=${parked.claim_token}`,
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
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

          {!user && (
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              aria-label="Seu e-mail"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <SubmitButton
            working={user ? "Começando…" : "Enviando o link…"}
            className="rounded-lg bg-zinc-900 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Examinar
          </SubmitButton>

          {!user && (
            <p className="text-xs text-zinc-500">
              Mandamos o resultado por um link no seu e-mail. Sem senha: o link
              é a sua entrada.
            </p>
          )}
        </form>
      )}
    </main>
  );
}
