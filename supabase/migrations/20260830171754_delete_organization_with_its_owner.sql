-- An organization is created by whoever signs up, and that person is its owner.
-- Deleting the owner takes the organization with them, and the organization
-- takes any remaining members by cascade.
--
-- The point is that no organization is ever left without a member. A memberless
-- organization is not dormant, it is unreachable forever: every read goes
-- through is_member_of, and there is no insert policy on members to put anyone
-- back in.
--
-- SECURITY DEFINER because this usually runs as a cascade from a delete on
-- auth.users, which GoTrue performs as supabase_auth_admin — a role with no
-- privileges of its own on public.organizations.
create function public.delete_owned_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' then
    delete from public.organizations where id = old.organization_id;
  end if;
  return null;
end;
$$;

revoke execute on function public.delete_owned_organization()
  from public, anon, authenticated;

-- ponytail: "the owner leaving means the organization dies" holds while an
-- organization is one person. Once members can be invited, deleting an owner
-- has to require handing the role to someone else first — otherwise removing
-- one person silently takes down an account holding other people's stores.
create trigger on_owner_deleted
  after delete on public.members
  for each row execute function public.delete_owned_organization();
