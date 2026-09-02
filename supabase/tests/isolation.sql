-- Proof that one organization cannot read another's rows.
--
-- The isolation this checks is enforced by the database, not the application,
-- so the test speaks SQL: it becomes the `authenticated` role with a forged
-- `sub` claim and asks what that user can see. No app, no keys, no seeded
-- accounts.
--
-- Everything happens inside a transaction that ends in ROLLBACK, so running it
-- against a live project leaves nothing behind. Silence is a pass; a failure
-- raises and aborts.
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
--
-- It also runs pasted whole into the SQL editor, or through the Supabase MCP.

begin;

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  org_a uuid;
  org_b uuid;
  store_a uuid;
  store_b uuid;
  visible int;
begin
  -- Two signups. The organization is not created here on purpose: the trigger
  -- on auth.users is what should create it, and that is part of what is tested.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'isolation-a@example.com', '', now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'isolation-b@example.com', '', now(), now());

  select organization_id into org_a from public.members where user_id = a;
  select organization_id into org_b from public.members where user_id = b;
  if org_a is null or org_b is null then
    raise exception 'signing up did not put the user in an organization';
  end if;
  if org_a = org_b then
    raise exception 'both signups landed in the same organization';
  end if;

  -- One store each, because a reading that belongs to an organization belongs
  -- to one of its stores: `scans_store_with_organization` says so, and this test
  -- silently stopped running the day that constraint arrived (#49). Nothing runs
  -- these files on a schedule, which is exactly how a proof rots unnoticed.
  insert into public.stores (organization_id, host) values (org_a, 'loja-a.example')
  returning id into store_a;
  insert into public.stores (organization_id, host) values (org_b, 'loja-b.example')
  returning id into store_b;

  -- One scan for each organization, plus an anonymous one belonging to nobody:
  -- the shape the table actually holds once people scan before signing up. The
  -- anonymous one has no store either, which is the pair the constraint allows.
  insert into public.scans (organization_id, store_id, url) values (org_a, store_a, 'https://loja-a.example');
  insert into public.scans (organization_id, store_id, url) values (org_b, store_b, 'https://loja-b.example');
  insert into public.scans (organization_id, url) values (null, 'https://anonimo.example');

  -- From here on we are A, seen through RLS exactly as a request from the app.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into visible from public.organizations;
  if visible <> 1 then
    raise exception 'A sees % organizations, expected only its own', visible;
  end if;

  select count(*) into visible from public.organizations where id = org_b;
  if visible <> 0 then
    raise exception 'A can read B''s organization';
  end if;

  select count(*) into visible from public.members where organization_id = org_b;
  if visible <> 0 then
    raise exception 'A can read who belongs to B''s organization';
  end if;

  select count(*) into visible from public.scans;
  if visible <> 1 then
    raise exception 'A sees % scans, expected only its own', visible;
  end if;

  select count(*) into visible from public.scans where organization_id = org_b;
  if visible <> 0 then
    raise exception 'A can read B''s scan';
  end if;

  -- The anonymous scan belongs to no organization, so it matches no policy.
  -- Being signed in must not be a way to read what strangers scanned.
  select count(*) into visible from public.scans where organization_id is null;
  if visible <> 0 then
    raise exception 'a signed-in member can read anonymous scans';
  end if;

  -- Writes are denied by default: there is no insert, update or delete policy
  -- on either table, and none should appear without a ticket asking for it.
  begin
    insert into public.organizations (name) values ('smuggled');
    raise exception 'A could create an organization';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.organizations set name = 'renamed' where id = org_a;
    if found then
      raise exception 'A could rename its own organization';
    end if;
  exception when insufficient_privilege then null;
  end;

  -- A scan is a fact our own browser observed. If a signed-in member could
  -- write one, anyone could record that any store carried any cookie, and the
  -- findings built on scans later would inherit that.
  begin
    insert into public.scans (organization_id, store_id, url) values (org_a, store_a, 'https://forjado.example');
    raise exception 'A could record a scan';
  exception when insufficient_privilege then null;
  end;

  -- Nor a store. A store is what our own server recorded from a reading, not
  -- something a visitor asserts.
  begin
    insert into public.stores (organization_id, host) values (org_a, 'forjada.example');
    raise exception 'A could record a store';
  exception when insufficient_privilege then null;
  end;

  reset role;
  raise notice 'isolation holds';
end $$;

rollback;
