-- A scan is one run of the audit over one store at one instant (CONTEXT.md).
--
-- `organization_id` is nullable because the first scan a person runs happens
-- before they have an account — that is the whole point of the anonymous scan.
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  url text not null,
  cookies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  -- Bearer capability over an unclaimed scan: whoever holds it can attach the
  -- scan to their organization when they sign up. Kept separate from `id` on
  -- purpose — an id ends up in links, logs and admin screens, and the day it
  -- does, an id that doubles as a capability hands the scan to whoever read it.
  claim_token uuid not null default gen_random_uuid(),

  -- ponytail: nothing deletes expired rows yet. pg_cron is available on this
  -- project and a daily `delete from public.scans where organization_id is null
  -- and expires_at < now()` closes it — worth scheduling once anonymous scans
  -- actually arrive, not while the table is empty.
  expires_at timestamptz not null default now() + interval '7 days'
);

create index scans_organization_id_idx on public.scans (organization_id);

alter table public.scans enable row level security;

-- Same shape as every other read in this database: scoped to the caller's
-- organizations. A scan with no organization matches no policy and is therefore
-- readable by nobody through the API — the anonymous result is returned in the
-- response that produced it, never fetched back.
create policy "members read scans of their own organizations"
  on public.scans for select to authenticated
  using (
    organization_id is not null and public.is_member_of(organization_id)
  );

-- No insert, update or delete policies, as everywhere else. Scans are written
-- by the server with the service role: a scan is a fact our own browser
-- observed, not something a visitor may assert. An RPC open to `anon` would let
-- anyone record that any store carried any cookie, and the findings built on
-- scans later would inherit that.
