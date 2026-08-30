-- The scans table becomes its own queue.
--
-- Not Vercel Queues and not pgmq: the waiting screen needs Supabase Realtime on
-- this table anyway, so a queue anywhere else would be a second mechanism for
-- one job — and a queue nobody can inspect with a SELECT.

create type public.scan_status as enum (
  -- The URL is parked. Nothing runs: the person typed an e-mail but has not
  -- proved it is theirs, and proving it is the whole point of the gate.
  'awaiting_confirmation',
  -- The magic link was clicked. Now it may run, oldest first.
  'pending',
  'running',
  'done',
  'failed'
);

alter table public.scans
  add column status public.scan_status not null default 'awaiting_confirmation',
  add column pending_at timestamptz,
  add column started_at timestamptz,
  add column finished_at timestamptz,
  add column attempts integer not null default 0,
  add column failure text;

-- Rows that predate the queue are finished anonymous scans, not work waiting.
update public.scans set status = 'done', finished_at = created_at;

-- The queue's own read: oldest pending first.
create index scans_pending_idx on public.scans (pending_at)
  where status = 'pending';

-- Counting the running ones happens on every slot attempt.
create index scans_running_idx on public.scans (started_at)
  where status = 'running';

/*
 * Takes a slot, or reports that every slot is busy.
 *
 * The obvious version of this is wrong, and wrong silently:
 *
 *   update ... where (select count(*) ... where status = 'running') < max
 *
 * Under READ COMMITTED two transactions read the same count and both proceed,
 * so the cap that is the entire reason the queue exists quietly stops holding.
 * The advisory lock serialises slot-taking; it is held for microseconds.
 *
 * The `started_at` window is not an optimisation. A function that dies mid-scan
 * leaves its row in `running` forever and eats a slot permanently — five bad
 * deaths and the queue stops, with no error anywhere to explain it. A scan takes
 * about ten seconds, so five minutes is generous.
 *
 * ponytail: one global lock, so slot-taking is serial across the project. It is
 * held for microseconds and is nowhere near a bottleneck at this size. If scans
 * ever queue per organization, this becomes a lock per key.
 */
create function public.take_scan_slot(scan uuid, max_running integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  taken uuid;
begin
  perform pg_advisory_xact_lock(hashtext('scan-slots'));

  update public.scans
  set status = 'running',
      started_at = now(),
      attempts = attempts + 1
  where id = scan
    and status = 'pending'
    and (
      select count(*)
      from public.scans
      where status = 'running'
        and started_at > now() - interval '5 minutes'
    ) < max_running
  returning id into taken;

  return taken is not null;
end;
$$;

/*
 * The next scan waiting, oldest click first.
 *
 * Everyone in this queue has already proved they own their e-mail — that is
 * what the magic link does — so there is nothing to prioritise. Plain FIFO.
 */
create function public.next_pending_scan()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select id
  from public.scans
  where status = 'pending'
  order by pending_at
  limit 1;
$$;

-- Both are for the worker, which runs as the service role. The service role is
-- not subject to these grants; taking them away only closes the REST endpoints
-- that PostgREST would otherwise expose to clients.
revoke execute on function public.take_scan_slot(uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.next_pending_scan()
  from public, anon, authenticated;
