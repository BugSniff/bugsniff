-- Proof that an organization never outlives its last member.
--
-- A memberless organization is not dormant, it is unreachable forever: every
-- read goes through `is_member_of`, and there is no insert policy on `members`
-- to put anyone back in. So the rule is that the owner takes the organization
-- with them, while an ordinary member leaves it standing.
--
-- Runs inside a transaction that ends in ROLLBACK, so it can point at a live
-- project and leave nothing behind. Silence is a pass.
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/organization-lifecycle.sql

begin;

do $$
declare
  owner_id uuid := gen_random_uuid();
  colleague_id uuid := gen_random_uuid();
  org uuid;
  members_left int;
  orgs_left int;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lifecycle-owner@example.org', '', now(), now()),
         (colleague_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lifecycle-colleague@example.org', '', now(), now());

  select organization_id into org from public.members where user_id = owner_id;

  -- Put the colleague in the owner's organization, and drop the one signing up
  -- built for them: this test is about a single shared organization.
  delete from public.organizations
  where id = (select organization_id from public.members where user_id = colleague_id);

  insert into public.members (organization_id, user_id, role)
  values (org, colleague_id, 'member');

  -- An ordinary member leaving takes nobody else with them.
  delete from auth.users where id = colleague_id;

  select count(*) into members_left from public.members where organization_id = org;
  if members_left <> 1 then
    raise exception 'after the colleague left, the organization has % members, expected the owner alone', members_left;
  end if;

  select count(*) into orgs_left from public.organizations where id = org;
  if orgs_left <> 1 then
    raise exception 'an ordinary member leaving destroyed the organization';
  end if;

  -- The owner leaving takes the organization, and the organization takes the
  -- rest of its members.
  delete from auth.users where id = owner_id;

  select count(*) into orgs_left from public.organizations where id = org;
  if orgs_left <> 0 then
    raise exception 'the owner is gone and the organization is still standing';
  end if;

  select count(*) into members_left from public.members where organization_id = org;
  if members_left <> 0 then
    raise exception 'the organization is gone and % of its members are not', members_left;
  end if;

  raise notice 'an organization never outlives its last member';
end $$;

rollback;
