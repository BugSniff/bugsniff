import { IconReportAnalytics } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/packages/supabase/server";

/**
 * The shell of the app: navigation on the left, where you are on top.
 *
 * The navigation offers one destination because the product has one. The
 * canvas draws nine — Exames, Documentos, Banner, Relatórios, Monitoramento,
 * Lojas, Membros, Plano, Conta — and every one of them is a route that does
 * not exist yet; each arrives with the issue that builds it. A menu item that
 * leads nowhere is a promise the screen makes and the product does not keep.
 */
const NAV = [{ href: "/painel", label: "Painel", icon: IconReportAnalytics }];

/** The initials in the corner, from the address, since we have no name yet. */
const initials = (email: string) => email.slice(0, 2).toUpperCase();

export async function AppShell({
  active,
  crumbs,
  actions,
  children,
}: {
  /** Which nav item is the current page. */
  active?: string;
  /** Where you are, as the top bar says it. */
  crumbs: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  };

  return (
    <div className="flex min-h-full flex-1">
      <nav className="hidden w-64 shrink-0 flex-col gap-3 border-r bg-sidebar p-3 text-sidebar-foreground md:flex">
        <Link href="/painel" className="px-2 py-1.5">
          <Brand />
        </Link>

        <div className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-4xl px-2.5 text-sm",
                active === href
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground [&_svg]:text-sidebar-primary"
                  : "[&_svg]:text-muted-foreground"
              )}
            >
              <Icon size={16} stroke={2} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t p-2.5">
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            {initials(user?.email ?? "?")}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.email}
          </span>
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="ghost" size="xs">
              Sair
            </Button>
          </form>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* On a phone there is no sidebar to carry the mark, so it rides here. */}
            <Link href="/painel" className="md:hidden">
              <Brand />
            </Link>
            {crumbs}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>

        <div className="flex flex-col gap-5 p-6">{children}</div>
      </div>
    </div>
  );
}
