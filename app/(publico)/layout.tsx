import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/packages/supabase/server";

/**
 * The funnel: the mark, and a way in. No sidebar, because nobody here is
 * inside yet.
 *
 * Who is signed in is shown even so, because of the magic link — a person can
 * arrive on any of these pages already carrying a session, and a page that
 * says nothing about it leaves them wondering whether the link worked.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b px-10 py-5">
        <Link href="/">
          <Brand />
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form
              action={async () => {
                "use server";
                const client = await createClient();
                await client.auth.signOut();
                redirect("/");
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Entrar
          </Link>
        )}
      </header>

      {children}
    </>
  );
}
