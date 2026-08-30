import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/packages/supabase/server";
import { SubmitButton } from "../submit-button";

/**
 * Sends the link that is the only way in.
 *
 * There is no password anywhere in this app. `signInWithOtp` signs in an
 * existing account and creates one that does not exist yet, so entering and
 * signing up are the same act and the same field — and the trigger on
 * `auth.users` gives a new person their organization on the way through.
 */
async function sendLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");

  // Taken from the request so localhost, previews and production each send a
  // link back to themselves.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?enviado=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const { error, enviado } = await searchParams;

  // Someone already signed in has nothing to do here, and sending them a link
  // to prove what the session already proves only spends quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="mx-auto flex flex-1 w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entre com seu e-mail. Enviamos um link e você não precisa de senha.
        </p>
      </div>

      {enviado ? (
        <p
          role="status"
          className="rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
        >
          Link enviado. Abra seu e-mail para entrar — ele vale por pouco tempo e
          só funciona uma vez.
        </p>
      ) : (
        <form action={sendLink} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <SubmitButton
            working="Enviando…"
            className="rounded-lg bg-zinc-900 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Enviar link de acesso
          </SubmitButton>
        </form>
      )}

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          Examinar uma loja
        </Link>{" "}
        sem entrar primeiro.
      </p>
    </main>
  );
}
