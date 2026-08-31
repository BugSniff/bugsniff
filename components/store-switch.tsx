import {
  IconBuildingStore,
  IconCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Which store the person is looking at, and how they get to another one.
 *
 * The sidebar is the only place in the product where a store is a context
 * rather than a row in a table, and this is what makes it one. Whoever has a
 * single shop never opens it; an agency with thirty-eight changes context all
 * day, and the panel's table is a long way to travel for that.
 *
 * A `<details>` rather than a menu: it opens with the keyboard, closes with the
 * keyboard, and is announced by a screen reader without a line of JavaScript —
 * so the shell stays a server component and nothing about the sidebar has to
 * ship to the browser.
 */

type Store = { id: string; host: string };

const ROW =
  "flex w-full items-center gap-2 rounded-4xl border bg-input/30 px-2.5 py-[7px] text-left transition-colors hover:bg-input/50";

/** The store's mark and name, as the closed switch shows them. */
function Face({ host }: { host?: string }) {
  return (
    <>
      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-accent-foreground">
        <IconBuildingStore size={13} stroke={2} />
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="text-[11px] leading-tight text-muted-foreground">
          Loja
        </span>
        <span className="truncate text-[13px] leading-snug font-medium">
          {/* No store in view — on the panel, which is about all of them. */}
          {host ?? "todas"}
        </span>
      </span>
    </>
  );
}

export function StoreSwitch({
  stores,
  current,
}: {
  stores: readonly Store[];
  /** The store this page is about, when the page is about one. */
  current?: string;
}) {
  // Nothing to switch between, and nothing examined yet. The panel is already
  // saying so with the whole screen.
  if (stores.length === 0) return null;

  // One store is not a choice. It is still worth naming — it says which shop
  // everything on the screen is about — so it stays, as a way in rather than a
  // menu that opens onto its own answer.
  if (stores.length === 1) {
    return (
      <Link href={`/loja/${stores[0].id}`} className={ROW}>
        <Face host={stores[0].host} />
      </Link>
    );
  }

  const store = stores.find(({ id }) => id === current);

  return (
    <details className="group/switch">
      <summary
        className={cn(
          ROW,
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden"
        )}
      >
        <Face host={store?.host} />
        <IconChevronDown
          size={15}
          stroke={2}
          className="ml-auto shrink-0 text-muted-foreground transition-transform group-open/switch:rotate-180"
        />
      </summary>

      <div className="mt-1 flex flex-col gap-0.5">
        {stores.map(({ id, host }) => (
          <Link
            key={id}
            href={`/loja/${id}`}
            className={cn(
              "flex h-8 items-center gap-2 rounded-4xl px-2.5 text-[13px]",
              id === current
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/60"
            )}
          >
            <span className="truncate">{host}</span>
            {id === current && (
              <IconCheck
                size={14}
                stroke={2}
                className="ml-auto shrink-0 text-sidebar-primary"
              />
            )}
          </Link>
        ))}
      </div>
    </details>
  );
}
