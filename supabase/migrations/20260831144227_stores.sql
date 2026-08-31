-- The store, at last, as a thing rather than as a string.
--
-- CONTEXT.md has defined Loja since the beginning — "a loja virtual sob
-- auditoria, identificada pela sua URL" — while the database only ever had
-- `scans.url`. Two readings of the same shop were two unrelated rows, which is
-- why the panel showed the same address five times and could not say a single
-- true sentence about the shop across them.
--
-- Everything that comes next hangs here and not on a scan: the privacy policy
-- and its versions, the consent banner's blocklist, the OAuth credential for
-- the platform, the monitoring schedule. A scan is a moment; a store is what
-- has a history.
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  -- The canonical address, and the identity: lowercased host, no scheme, no
  -- port, no path, no leading `www.`. `https://www.loja.com.br/produtos` and
  -- `http://loja.com.br` are the same shop, and this column is what says so.
  -- The exact address each reading opened stays on the scan, where it belongs:
  -- that is an observed fact, this is an identity.
  host text not null,

  created_at timestamptz not null default now(),

  -- One store per address per organization. Two agencies may both audit the
  -- same shop, and neither should see the other's readings of it.
  unique (organization_id, host)
);

create index stores_organization_id_idx on public.stores (organization_id);

alter table public.stores enable row level security;

-- Same shape as every other read here: scoped to the caller's organizations.
create policy "members read stores of their own organizations"
  on public.stores for select to authenticated
  using (public.is_member_of(organization_id));

-- No insert, update or delete policies, as everywhere else. A store is created
-- by the server when a scan is recorded against it.

alter table public.scans
  add column store_id uuid references public.stores (id) on delete cascade;

create index scans_store_id_idx on public.scans (store_id);

-- Backfill: every scan that already belongs to an organization gets the store
-- its address names, created here if this is the first reading of it.
with hosts as (
  select
    id,
    organization_id,
    regexp_replace(
      regexp_replace(
        split_part(regexp_replace(lower(url), '^[a-z]+://', ''), '/', 1),
        ':\d+$', ''
      ),
      '^www\.', ''
    ) as host
  from public.scans
  where organization_id is not null
),
created as (
  insert into public.stores (organization_id, host)
  select distinct organization_id, host from hosts
  returning id, organization_id, host
)
update public.scans s
set store_id = c.id
from hosts h
join created c
  on c.organization_id = h.organization_id and c.host = h.host
where s.id = h.id;

-- A scan that belongs to an organization belongs to one of its stores. The
-- anonymous scan, parked before anyone has an account, has neither — and gets
-- both in the same update when the magic link adopts it.
alter table public.scans
  add constraint scans_store_with_organization
  check (organization_id is null or store_id is not null);
