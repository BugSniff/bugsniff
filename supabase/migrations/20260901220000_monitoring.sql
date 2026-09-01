-- Monitoring: the store is read again on its own, and a reading that died
-- mid-flight is not left waiting forever.
--
-- Two halves, separate on purpose.
--
-- Re-reading is the product feature. A shop that installed an app last week
-- has a tracker this week that nobody chose and nobody saw, and an audit that
-- only answers when asked never finds it — the whole value of watching is that
-- it happens on a week when the lojista was not thinking about us.
--
-- Requeueing is the floor under it. The queue is carried today by the rule in
-- `app/(app)/exame/[id]/page.tsx`: whoever is waiting nudges it. That rule is
-- sound while a scan exists because somebody asked for it, and it collapses the
-- moment a scan exists because a schedule asked for it — nobody is on that
-- screen, so nobody is the sweeper, and one broken chain stops the queue with
-- no error anywhere to explain why.

-- Whether anybody asked for this reading.
--
-- The alert hangs on this column and nothing else does. A person who clicks
-- "examinar de novo" is looking at the screen while it runs, and mailing them
-- about what they are already reading is how a product teaches people to filter
-- it. The whole point of the alert is the reading nobody is watching.
alter table public.scans
  add column monitored boolean not null default false;

/*
 * Puts back the readings whose invocation never came home.
 *
 * The `running` row is the only state that can be abandoned: a function killed
 * mid-scan leaves it there and nothing else will ever touch it. `take_scan_slot`
 * already refuses to count such a row against the cap after five minutes, so
 * the slot comes back on its own — but the row does not, and the person looking
 * at it waits forever on a screen that says it started.
 *
 * Five minutes because that is what `take_scan_slot` uses to free the slot, and
 * the two numbers describing the same corpse must not disagree. It is generous
 * against `maxDuration = 180` on the worker: a function that is going to die is
 * dead by three minutes.
 *
 * `attempts` is what stops this from being a loop. A store that kills our
 * browser would otherwise be retried until the end of time, three times a day,
 * forever. After the third it is a failure with a reason, which is a thing
 * atendimento can read.
 */
create function public.requeue_stuck_scans(max_attempts integer default 3)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  moved integer;
begin
  update public.scans
  set
    status = case
      when attempts < max_attempts then 'pending'::public.scan_status
      else 'failed'::public.scan_status
    end,
    -- Back of the queue, not the front: it already had its turn, and a reading
    -- that dies repeatedly would otherwise hold the head of the line.
    pending_at = case when attempts < max_attempts then now() else pending_at end,
    started_at = null,
    failure = case when attempts >= max_attempts then 'abandoned' else failure end,
    finished_at = case when attempts >= max_attempts then now() else finished_at end
  where status = 'running'
    and started_at < now() - interval '5 minutes';

  get diagnostics moved = row_count;
  return moved;
end;
$$;

/*
 * Queues one reading for every store that is due for another one.
 *
 * Nothing is written on a store to schedule it. The due date is derived from
 * the readings the store already has, which is the same fact seen from the
 * other side — and a column would be a second copy of it, free to drift from
 * the scans it claims to describe.
 *
 * `every` is a parameter and not a constant so that the schedule lives in the
 * caller, where it can be read next to the cron line that runs it.
 */
create function public.enqueue_monitoring_scans(every interval default interval '7 days')
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.scans
    (organization_id, store_id, url, status, pending_at, monitored)
  select
    s.organization_id,
    s.id,
    -- The store's identity is its host (see `stores`), and the address to open
    -- is rebuilt from it rather than copied from the last scan: a reading that
    -- happened to be asked about a deep link should not pin every future
    -- reading to that page.
    'https://' || s.host,
    'pending'::public.scan_status,
    now(),
    true
  from public.stores s
  where
    -- A store nobody has read successfully is not a store being watched.
    -- Monitoring re-reads; there is nothing here to re-read.
    exists (
      select 1 from public.scans r
      where r.store_id = s.id and r.status = 'done'
    )
    -- Nothing already in flight for this shop. Two readings of the same store
    -- in the same queue measure one thing twice and bill for both.
    and not exists (
      select 1 from public.scans q
      where q.store_id = s.id
        and q.status in (
          'awaiting_confirmation'::public.scan_status,
          'pending'::public.scan_status,
          'running'::public.scan_status
        )
    )
    -- Due since the last time anyone read it, however that reading ended.
    -- Counting a failure as a reading is deliberate: a shop that turns our
    -- browser away would otherwise be retried on every single run, forever,
    -- and the store that costs the most would be the one we learn least from.
    and (
      select max(coalesce(r.finished_at, r.created_at))
      from public.scans r
      where r.store_id = s.id
    ) < now() - every
  returning id;
$$;

-- Both are for the worker and the cron, which run as the service role. The
-- service role is not subject to these grants; taking them away only closes the
-- REST endpoints PostgREST would otherwise expose to clients. `authenticated`
-- calling `enqueue_monitoring_scans` would be a free scan of every store in the
-- database, billed to us.
revoke execute on function public.requeue_stuck_scans(integer)
  from public, anon, authenticated;
revoke execute on function public.enqueue_monitoring_scans(interval)
  from public, anon, authenticated;

-- Every minute, and in the database rather than on a schedule of ours.
--
-- Vercel's cron on this plan fires once a day, which is the wrong order of
-- magnitude for "this reading is stuck": a person watching a scan would sit in
-- front of a screen that says `running` until tomorrow. This half needs no HTTP
-- and no browser — it is one UPDATE — so it belongs where a minute is cheap.
select cron.schedule(
  'requeue-stuck-scans',
  '* * * * *',
  $$ select public.requeue_stuck_scans() $$
);
