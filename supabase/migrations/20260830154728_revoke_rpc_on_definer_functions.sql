-- PostgREST exposes every function in `public` as an RPC endpoint, and Postgres
-- grants EXECUTE on a new function to PUBLIC. Neither of these functions is
-- meant to be called by a client, so take the grant away at the source: revoking
-- from `anon` and `authenticated` alone changes nothing while PUBLIC still holds
-- it.

-- Trigger function: only the insert on `auth.users` should ever fire it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- A policy expression is evaluated as the querying role, so `authenticated`
-- needs EXECUTE or every read breaks. Granted explicitly, since PUBLIC no longer
-- carries it. Signed-out callers have no uid to ask about.
revoke execute on function public.is_member_of(uuid) from public, anon;
grant execute on function public.is_member_of(uuid) to authenticated;
