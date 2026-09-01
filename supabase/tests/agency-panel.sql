-- Proof that the agency's two new powers stop where the organization does.
--
-- Both are writes a person performs, which is what makes them worth a file.
-- Naming the client touches `stores`, a table that until now had no write policy
-- at all. Scanning in bulk spends money — a browser per store — so an endpoint
-- that could be pointed at somebody else's stores is an endpoint that bills us
-- for a stranger's curiosity.
--
-- The host is the sharpest case here. It is the store's identity: every reading
-- hangs off it, and rewriting it would move one shop's history onto another. The
-- first version of this migration granted the column and stopped there, and this
-- test is what caught it — Supabase grants table-wide UPDATE to `authenticated`
-- by default and leans on RLS, so a column grant added on top restricts nothing
-- until the table-wide one is revoked.
--
-- Everything happens inside a transaction that ends in ROLLBACK, so running it
-- against a live project leaves nothing behind. Silence is a pass.
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/agency-panel.sql
--
-- It also runs pasted whole into the SQL editor, or through the Supabase MCP.

begin;

do $$
declare
  boss uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid;
  busy uuid;
  idle uuid;
  queued int;
  seen int;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (boss, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agencia@example.org', '', now(), now()),
         (outsider, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fora@example.org', '', now(), now());

  select organization_id into org from public.members where user_id = boss;

  insert into public.stores (organization_id, host) values (org, 'uma.example')
  returning id into busy;
  insert into public.stores (organization_id, host) values (org, 'outra.example')
  returning id into idle;

  -- Uma delas já está na fila. Enfileirá-la de novo mediria a mesma loja duas
  -- vezes e cobraria pelas duas.
  insert into public.scans (organization_id, store_id, url, status, pending_at)
  values (org, busy, 'https://uma.example', 'pending', now());

  perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
  set local role authenticated;

  ------------------------------------------------------------- exame em lote

  select count(*) into queued from public.enqueue_organization_scans(org);
  if queued <> 1 then
    raise exception 'batch queued % scans, expected only the store that was idle', queued;
  end if;

  ------------------------------------------------ o rótulo, e só o rótulo

  update public.stores set client = 'Padaria do Bairro' where id = idle;
  select count(*) into seen from public.stores
  where id = idle and client = 'Padaria do Bairro';
  if seen <> 1 then
    raise exception 'an owner could not name the client of their own store';
  end if;

  -- A identidade da loja não é editável por ninguém pelo produto.
  begin
    update public.stores set host = 'sequestrada.example' where id = idle;
    raise exception 'an owner rewrote the host of a store';
  exception when insufficient_privilege then null;
  end;

  reset role;

  --------------------------------------------- e nada disso alcança os outros

  perform set_config('request.jwt.claims', json_build_object('sub', outsider, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into queued from public.enqueue_organization_scans(org);
  if queued <> 0 then
    raise exception 'an outsider queued % scans against somebody else''s stores', queued;
  end if;

  begin
    update public.stores set client = 'sequestrado' where id = idle;
    if found then
      raise exception 'an outsider named the client of somebody else''s store';
    end if;
  exception when insufficient_privilege then null;
  end;

  reset role;
  raise notice 'batch scan and client label hold';
end $$;

rollback;
