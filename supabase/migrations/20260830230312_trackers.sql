-- A tracker is a cookie or third-party request attributable to a named
-- service (CONTEXT.md). This is the table that does the attributing.
--
-- Data, not code, and deliberately so: the correspondence between `_fbp` and
-- Meta Pixel changes when vendors change, which has nothing to do with when we
-- ship software. A new row names a new tracker on every scan already recorded,
-- with no deploy — and the rows are versioned here, in the migration, so the
-- list still has a history.
--
-- What this table is NOT: a judgement. Naming a cookie says which service
-- wrote it, never whether it should have been written.
create table public.trackers (
  id uuid primary key default gen_random_uuid(),
  -- The name a person recognises. Not our vocabulary: the vendor's.
  name text not null,
  -- A regular expression over the cookie's name, matched case-insensitively.
  -- Patterns come only from here, and this table has no write policy, so no
  -- visitor can hand the report an expression to evaluate.
  cookie_pattern text not null,
  created_at timestamptz not null default now()
);

alter table public.trackers enable row level security;

-- Reference data about public services, read by whoever is reading a scan.
-- Nothing here is about a person or an organization.
create policy "trackers are readable" on public.trackers
  for select to authenticated, anon using (true);

-- No insert, update or delete policy: the list is ours, and a visitor who
-- could add rows could rename any cookie into any accusation.

insert into public.trackers (name, cookie_pattern) values
  ('Meta Pixel', '^_fbp$|^_fbc$'),
  ('Google Analytics', '^_ga|^_gid$|^_gat'),
  ('Google Ads', '^_gcl_'),
  ('Google DoubleClick', '^IDE$|^test_cookie$|^DSID$'),
  ('TikTok', '^_ttp$|^_tt_|^ttcsid'),
  ('Hotjar', '^_hj'),
  ('Microsoft Clarity', '^_clck$|^_clsk$'),
  ('Microsoft Ads', '^_uet'),
  ('LinkedIn', '^li_|^lidc$|^bcookie$|^bscookie$'),
  ('Pinterest', '^_pin_'),
  ('Reddit', '^_rdt'),
  ('Criteo', '^cto_'),
  ('Hubspot', '^__hs|^hubspotutk$'),
  ('RD Station', '^rdtrk$|^__trf'),
  ('Segment', '^ajs_'),
  ('Yandex Metrica', '^_ym'),
  ('Snapchat', '^_scid$|^sc_at$'),
  ('VWO', '^_vwo'),
  ('Mixpanel', '^mp_'),
  ('Amplitude', '^amp_|^amplitude');
