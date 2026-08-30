import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/packages/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <Link href="/login" className="text-sm underline">
          Entrar
        </Link>
      </main>
    );
  }

  // RLS restricts this to organizations the caller belongs to, so no filter is
  // needed here — and no filter would save us if the policy were wrong.
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">
        {organization?.name ?? "Sem organização"}
      </h1>
      <p className="text-sm text-zinc-500">{user.email}</p>
      <form
        action={async () => {
          "use server";
          const client = await createClient();
          await client.auth.signOut();
          redirect("/login");
        }}
      >
        <button className="text-sm underline">Sair</button>
      </form>
    </main>
  );
}
