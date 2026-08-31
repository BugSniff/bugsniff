import { AppShellSkeleton } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * What every screen behind the door shows while it is being read.
 *
 * One file for the whole group, not one per screen. All three — painel, loja,
 * exame — are a title over a card of rows, and a skeleton's job is to say
 * something is coming, not to preview it. Guessing each page's shape precisely
 * would be three files to keep in sync with three layouts, in exchange for a
 * fidelity nobody stays long enough to check.
 *
 * The queries behind these screens are not slow enough to notice on a fast
 * connection and are very noticeable on a bad one, which is exactly the case
 * that had no feedback at all: the old screen simply sat there, and the only
 * thing a person could conclude was that their click had not registered.
 */
export default function Loading() {
  return (
    <AppShellSkeleton active="/painel">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32 rounded-4xl" />
      </div>

      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-2 px-6 py-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>

        <div className="flex flex-col gap-4 border-t px-6 py-5">
          {ROWS.map((width, row) => (
            <div key={row} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-1" style={{ maxWidth: width }} />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </AppShellSkeleton>
  );
}

/**
 * Uneven on purpose: rows of identical width read as a loading bar, and a
 * loading bar promises progress we have no way of measuring.
 */
const ROWS = ["14rem", "11rem", "16rem", "9rem"];
