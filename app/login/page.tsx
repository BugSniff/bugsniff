import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/packages/supabase/server";

async function authenticate(formData: FormData, signingUp: boolean) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  // Where the confirmation link should come back to. Without it Supabase falls
  // back to the project's Site URL, which is the root of the site — the link
  // would land somewhere that does not trade the code for a session, and the
  // account would never confirm.
  //
  // Taken from the request rather than an env var so localhost, previews and
  // production each send a link back to themselves. Server Actions always carry
  // an Origin header; Next refuses the request otherwise.
  const origin = (await headers()).get("origin");

  const { data, error } = signingUp
    ? await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      })
    : await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Signing up only returns a session when the project auto-confirms e-mail.
  // It does not, so say so: otherwise this lands back on a logged-out home page
  // with no explanation and the person tries again.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("Confirme seu e-mail para entrar. O link está na sua caixa de entrada.")}`
    );
  }

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entre para acompanhar suas lojas.
        </p>
      </div>

      <form className="flex flex-col gap-3">
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
          minLength={8}
          autoComplete="current-password"
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

        <button
          formAction={async (data: FormData) => {
            "use server";
            await authenticate(data, false);
          }}
          className="rounded-lg bg-zinc-900 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Entrar
        </button>
        <button
          formAction={async (data: FormData) => {
            "use server";
            await authenticate(data, true);
          }}
          className="rounded-lg border border-zinc-300 py-2 dark:border-zinc-700"
        >
          Criar conta
        </button>
      </form>
    </main>
  );
}
