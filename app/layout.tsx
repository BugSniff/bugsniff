import type { Metadata } from "next";
import { Geist_Mono, Public_Sans, Noto_Sans } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
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
 * Who is signed in, on every page.
 *
 * It lives here rather than on each page because of the magic link: someone
 * clicking a link in their inbox lands straight on a scan, already signed in,
 * and a page that says nothing about it leaves them wondering whether the link
 * worked at all. The answer belongs wherever they land, not only on the home
 * page.
 */
async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-end gap-3 px-6 py-4 text-sm text-zinc-500">
      {user ? (
        <>
          <span>{user.email}</span>
          <form
            action={async () => {
              "use server";
              const client = await createClient();
              await client.auth.signOut();
              redirect("/");
            }}
          >
            <button className="underline">Sair</button>
          </form>
        </>
      ) : (
        <Link href="/login" className="underline">
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
        <Account />
        {children}
      </body>
    </html>
  );
}
