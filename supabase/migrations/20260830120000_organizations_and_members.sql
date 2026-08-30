-- Organizations and members: the tenancy spine.
--
-- An agency with forty stores and a merchant with one are the SAME entity. The
-- difference is how many stores they hold, never a different table or a
-- different code path (see CONTEXT.md).

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create type public.member_role as enum ('owner', 'admin', 'member');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index members_user_id_idx on public.members (user_id);

-- Membership test used by every policy in the database.
--
-- It is SECURITY DEFINER on purpose: reading `members` from inside a policy ON
-- `members` would recurse. Running as definer bypasses that table's own RLS,
-- which is safe here because the function only ever answers a yes/no about the
-- caller's own uid and never returns rows.
create function public.is_member_of(org uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.members m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
  );
$$;

alter table public.organizations enable row level security;
alter table public.members enable row level security;

create policy "members read their own organizations"
  on public.organizations for select to authenticated
  using (public.is_member_of(id));

create policy "members read membership of their own organizations"
  on public.members for select to authenticated
  using (public.is_member_of(organization_id));

-- No insert, update or delete policies. Everything is denied by default;
-- organizations are created by the trigger below, which runs as definer.
-- Grant writes deliberately, one policy at a time, when a ticket needs them.

-- Every new user lands in their own organization, as its owner. Without this a
-- freshly signed-up person would have an account and belong nowhere.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
begin
  insert into public.organizations (name)
  values (
    coalesce(
      nullif(new.raw_user_meta_data ->> 'organization_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  returning id into new_organization_id;

  insert into public.members (organization_id, user_id, role)
  values (new_organization_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
