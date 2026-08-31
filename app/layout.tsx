import type { Metadata } from "next";
import { Geist_Mono, Public_Sans, Noto_Sans } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/packages/supabase/server";
import "./globals.css";
import { cn } from "@/lib/utils";

const notoSansHeading = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "bugsniff",
  description:
    "Veja o que uma loja virtual grava no navegador de quem visita, e como isso se compara ao que ela declara fazer.",
};

/**
 * The top of the public shell: the mark, and who is signed in.
 *
 * The mark is here because every screen in the system carries it — this is the
 * only chrome the funnel has, and a page with no mark at all is a page that
 * could be anybody's.
 *
 * Who is signed in is here rather than on each page because of the magic link:
 * someone clicking a link in their inbox lands straight on a scan, already
 * signed in, and a page that says nothing about it leaves them wondering
 * whether the link worked at all. The answer belongs wherever they land.
 */
async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
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
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        publicSans.variable,
        notoSansHeading.variable,
        geistMono.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <TopBar />
        {children}
      </body>
    </html>
  );
}
