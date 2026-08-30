-- The waiting screen watches its own scan instead of asking again and again.
--
-- A scan usually finishes in about ten seconds, but the wait is the queue's
-- wait, not the scan's — under load it is however long the slots take to free.
-- Polling a page for an unknown number of minutes is the thing this avoids.
--
-- Realtime honours row level security, and the select policy on `scans` is
-- already scoped by organization, so a subscriber only ever receives changes to
-- scans their own organization owns.
alter publication supabase_realtime add table public.scans;
