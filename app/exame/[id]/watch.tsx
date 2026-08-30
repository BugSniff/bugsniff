"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/packages/supabase/client";

/**
 * Re-renders the page when this scan changes.
 *
 * The wait is the queue's wait, not the scan's: ten seconds when a slot is free,
 * however long the slots take otherwise. Asking again every few seconds for an
 * unknown number of minutes is what this avoids.
 *
 * Realtime honours row level security, so the subscription only ever delivers
 * scans this person's organization owns.
 */
export function Watch({ scanId }: { scanId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`scan:${scanId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "scans",
          filter: `id=eq.${scanId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scanId, router]);

  return null;
}
