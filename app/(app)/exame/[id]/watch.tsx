"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/packages/supabase/client";

/**
 * How often to look again anyway.
 *
 * Slow on purpose: the live connection is the fast path, this only exists so
 * the screen can never sit there forever. A person watching a scan that already
 * finished is the one outcome this page must not produce, and a channel that
 * fails quietly looks exactly like a scan that is still queued.
 */
const FALLBACK_MS = 5000;

/**
 * Re-renders the page when this scan changes.
 *
 * The wait is the queue's wait, not the scan's: ten seconds when a slot is free,
 * however long the slots take otherwise.
 */
export function Watch({ scanId }: { scanId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const fallback = setInterval(() => router.refresh(), FALLBACK_MS);

    void (async () => {
      // Realtime applies the subscriber's own row level security, so the socket
      // has to carry a session. The browser client reads that from cookies, and
      // reads it asynchronously — subscribing before it lands connects as an
      // anonymous caller, whose policy matches no scan at all, and the channel
      // then sits there delivering nothing while looking perfectly healthy.
      await supabase.auth.getSession();
      if (cancelled) return;

      channel = supabase
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
    })();

    return () => {
      cancelled = true;
      clearInterval(fallback);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [scanId, router]);

  return null;
}
