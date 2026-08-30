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

  reset role;
  raise notice 'isolation holds';
end $$;

rollback;
