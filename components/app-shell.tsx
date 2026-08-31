import { IconReportAnalytics } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { StoreSwitch } from "@/components/store-switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  store,
  crumbs,
  actions,
  children,
}: {
  /** Which nav item is the current page. */
  active?: string;
  /** Which store this page is about, when it is about one. */
  store?: string;
  /** Where you are, as the top bar says it. */
  crumbs: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // RLS scopes the stores to the caller's own organizations, so the switch can
  // only ever offer shops this person already audits.
  const [{ data: auth }, { data: stores }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("stores").select("id, host").order("host"),
  ]);

  const signOut = async () => {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  };

  return (
    <Frame
      active={active}
      switcher={<StoreSwitch stores={stores ?? []} current={store} />}
      who={
        <>
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            {initials(auth.user?.email ?? "?")}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {auth.user?.email}
          </span>
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="ghost" size="xs">
              Sair
            </Button>
          </form>
        </>
      }
      crumbs={crumbs}
      actions={actions}
    >
      {children}
    </Frame>
  );
}

/**
 * The frame, with holes where the answers go.
 *
 * Split out for the skeleton below, which has to draw the same sidebar without
 * being able to await anything. Two copies of this markup would drift the first
 * time a padding changes, and the drift would only show up mid-navigation,
 * which is the one moment nobody is looking closely.
 *
 * The brand and the navigation are inside rather than passed in: they are the
 * same links whether or not the answers have arrived, and a skeleton that greys
 * out something it already knows is a skeleton lying about what it is waiting
 * for.
 */
function Frame({
  active,
  switcher,
  who,
  crumbs,
  actions,
  children,
}: {
  active?: string;
  /** The store switch, or a stand-in while the stores are still coming. */
  switcher: React.ReactNode;
  /** Who is signed in, and the way out. */
  who: React.ReactNode;
  crumbs: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
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

        {switcher}

        <div className="mt-auto flex items-center gap-2 border-t p-2.5">
          {who}
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

/**
 * The shell while the page behind it is still being read.
 *
 * The navigation and the brand are real, because they are already true — what
 * greys out is only what the database has not answered yet. Without this the
 * sidebar goes away and comes back on every move between screens, and a
 * navigation that blanks the furniture reads as something having gone wrong.
 *
 * Synchronous on purpose: this is a Suspense fallback, and a fallback that
 * awaits anything is a fallback that is not there when it is needed.
 */
export function AppShellSkeleton({
  active,
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <Frame
      active={active}
      switcher={<Skeleton className="h-9 rounded-4xl" />}
      who={
        <>
          <Skeleton className="size-6.5 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </>
      }
      crumbs={<Skeleton className="h-4 w-24" />}
    >
      {children}
    </Frame>
  );
}
