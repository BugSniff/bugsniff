import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/packages/supabase/server";

/** Not a Server Action — just the two fields both screens post. */
function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

async function signIn(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    credentials(formData)
  );

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

async function signUp(formData: FormData) {
  "use server";

  // Where the confirmation link comes back to. Without it Supabase falls back to
  // the project's Site URL, which is the root of the site — the link would land
  // somewhere that does not trade the code for a session, and the account would
  // never confirm.
  //
  // Read from the request rather than an env var so localhost, previews and
  // production each send a link back to themselves.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    ...credentials(formData),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  // Signing up only returns a session when the project auto-confirms e-mail. It
  // does not, so say so: otherwise this lands on a logged-out page with no
  // explanation and the person signs up again.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("Confirme seu e-mail para entrar. O link está na sua caixa de entrada.")}`
    );
  }

  redirect("/");
}

/**
 * Sign in, or sign up at `?mode=signup`.
 *
 * Two screens rather than one form with two buttons. A button carries its own
 * name and value into the form data only if the browser hands React the
 * submitter, and not every browser does — when it does not, both buttons look
 * identical to the server and the second one silently does the first one's job.
 * One submit button per screen cannot be ambiguous, and pressing Enter does the
 * thing the screen is named after.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
}) {
  const { error, message, mode } = await searchParams;
  const signingUp = mode === "signup";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {signingUp
            ? "Crie sua conta para acompanhar suas lojas."
            : "Entre para acompanhar suas lojas."}
        </p>
      </div>

      <form
        action={signingUp ? signUp : signIn}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          name="password"
          required
          minLength={signingUp ? 8 : undefined}
          autoComplete={signingUp ? "new-password" : "current-password"}
          placeholder="sua senha"
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
        )}

        <button className="rounded-lg bg-zinc-900 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {signingUp ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        {signingUp ? (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="underline">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link href="/login?mode=signup" className="underline">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
