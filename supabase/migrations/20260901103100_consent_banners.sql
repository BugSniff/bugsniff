-- What the shop owner changed about their banner, and nothing else.
--
-- Not the blocklist. That is derived from the store's most recent reading
-- every time the code is generated, so a service named in `trackers` today is
-- blocked by a banner generated today even if the reading is a week old — the
-- same reason the report names trackers at read time instead of freezing them
-- into the scan. A blocklist column would be that list going stale in a place
-- nobody thinks to look.
--
-- Not on `stores` either: a store is an identity our server recorded from an
-- address, and this is a document a person wrote. A row missing here is not a
-- store missing a field, it is a banner nobody has customised yet, which is
-- the common case and needs no row at all.
create table public.consent_banners (
  store_id uuid primary key references public.stores (id) on delete cascade,

  -- Colours and wording, as one document. Read whole by one screen, written
  -- whole by one action, never queried by field — columns would buy nothing
  -- and would need a migration for every label the banner grows.
  --
  -- The shape lives in `packages/consent-banner`, which is also where it is
  -- validated: the values end up inside generated JavaScript, and the code
  -- that generates it is the code that has to refuse a colour that is not a
  -- colour.
  settings jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

alter table public.consent_banners enable row level security;

-- Same shape as every other read here: scoped through the store to the
-- caller's organizations.
create policy "members read consent banners of their own stores"
  on public.consent_banners for select to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and public.is_member_of(s.organization_id)
    )
  );

-- No insert, update or delete policies, as everywhere else in this database.
-- The settings are written by a server action that has already established
-- membership by reading the store through RLS.
