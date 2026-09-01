-- Proof that a person enters an organization only by invitation, and that the
-- owner cannot walk out of one with other people still inside.
--
-- These two are one test file because they are one guarantee. An invite without
-- the handover creates the exact state ADR-0004 names as dangerous: deleting one
-- person quietly takes down an account holding somebody else's stores. Checking
-- them apart would let either half pass while the pair is broken.
--
-- Everything happens inside a transaction that ends in ROLLBACK, so running it
-- against a live project leaves nothing behind. Silence is a pass; a failure
-- raises and aborts.
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/invites-and-ownership.sql
--
-- It also runs pasted whole into the SQL editor, or through the Supabase MCP.

begin;

do $$
declare
  founder uuid := gen_random_uuid();
  guest uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  latecomer uuid := gen_random_uuid();
  org uuid;
  stranger_org uuid;
  stranger_store uuid;
  founder_member uuid;
  guest_member uuid;
  outcome text;
  seen int;
  owners int;
begin
  ------------------------------------------------------------------ o convite

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (founder, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'founder@agencia.example', '', now(), now()),
         (stranger, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stranger@outra.example', '', now(), now());

  select organization_id, id into org, founder_member
  from public.members where user_id = founder;

  select organization_id into stranger_org
  from public.members where user_id = stranger;

  -- Emitido pela própria dona da organização, através da policy, como o produto
  -- faz. Inserir como postgres passaria por cima da policy que é o assunto.
  perform set_config('request.jwt.claims', json_build_object('sub', founder, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.invites (organization_id, email, invited_by)
  values (org, 'guest@agencia.example', founder_member);

  -- Assinar o convite com o nome de outra pessoa é recusado pela policy: a tela
  -- diz "convidado por", e ela não pode estar mostrando uma mentira que o banco
  -- aceitou.
  begin
    insert into public.invites (organization_id, email, invited_by)
    values (org, 'forjado@agencia.example', gen_random_uuid());
    raise exception 'the founder could sign an invite as somebody else';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;

  reset role;

  -- Convidar para a organização de outra pessoa não passa pela policy.
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    insert into public.invites (organization_id, email, invited_by)
    values (org, 'invasor@outra.example', founder_member);
    raise exception 'a stranger could invite into an organization that is not theirs';
  exception when insufficient_privilege then null;
  end;

  -- E não enxerga que o convite existe.
  select count(*) into seen from public.invites;
  if seen <> 0 then
    raise exception 'a stranger reads % invites of an organization they do not belong to', seen;
  end if;

  reset role;

  ------------------------------------------- quem chega convidado não cria org

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (guest, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guest@agencia.example', '', now(), now());

  select count(*) into seen from public.members where user_id = guest;
  if seen <> 1 then
    raise exception 'the guest landed in % organizations, expected exactly one', seen;
  end if;

  select id into guest_member from public.members
  where user_id = guest and organization_id = org;

  if guest_member is null then
    raise exception 'the guest did not land in the organization that invited them';
  end if;

  select count(*) into seen from public.invites
  where organization_id = org and accepted_at is not null;
  if seen <> 1 then
    raise exception 'the invite was not marked as accepted';
  end if;

  ----------------------------------------------- convite expirado não abre nada

  insert into public.invites (organization_id, email, invited_by, expires_at)
  values (org, 'latecomer@agencia.example', founder_member, now() - interval '1 day');

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (latecomer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'latecomer@agencia.example', '', now(), now());

  select count(*) into seen from public.members
  where user_id = latecomer and organization_id = org;
  if seen <> 0 then
    raise exception 'an expired invite still let somebody in';
  end if;

  -- Quem chega com convite vencido é alguém sem convite: ganha a própria
  -- organização, como qualquer cadastro.
  select count(*) into seen from public.members where user_id = latecomer;
  if seen <> 1 then
    raise exception 'the latecomer ended up in % organizations', seen;
  end if;

  ---------------------------------------------------- o membro continua cercado

  -- Uma loja com uma leitura, que é o que o membro de outra organização não pode
  -- alcançar. A loja vem antes do exame porque `scans_store_with_organization`
  -- exige as duas coisas juntas: exame de organização pertence a uma loja dela.
  insert into public.stores (organization_id, host)
  values (stranger_org, 'loja-do-stranger.example')
  returning id into stranger_store;

  insert into public.scans (organization_id, store_id, url)
  values (stranger_org, stranger_store, 'https://loja-do-stranger.example');

  perform set_config('request.jwt.claims', json_build_object('sub', guest, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into seen from public.organizations;
  if seen <> 1 then
    raise exception 'the guest sees % organizations, expected only the one they were invited to', seen;
  end if;

  select count(*) into seen from public.scans where organization_id = stranger_org;
  if seen <> 0 then
    raise exception 'a member of one organization reads another organization''s scans';
  end if;

  select count(*) into seen from public.stores where organization_id = stranger_org;
  if seen <> 0 then
    raise exception 'a member of one organization reads another organization''s stores';
  end if;

  -- Membro comum não convida: convidar é do proprietário e do administrador.
  begin
    insert into public.invites (organization_id, email, invited_by)
    values (org, 'amigo@agencia.example', guest_member);
    raise exception 'an ordinary member could invite';
  exception when insufficient_privilege then null;
  end;

  -- Nem remove ninguém.
  delete from public.members where id = founder_member;
  if found then
    raise exception 'an ordinary member could remove the owner';
  end if;

  reset role;

  --------------------------------------------------- o proprietário não escapa

  begin
    delete from auth.users where id = founder;
    raise exception 'the owner was deleted with somebody else still inside';
  exception when restrict_violation then null;
  end;

  ------------------------------------------------------------------- o repasse

  perform set_config('request.jwt.claims', json_build_object('sub', guest, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Quem não é proprietário não repassa, nem para si mesmo.
  select public.transfer_ownership(guest_member) into outcome;
  if outcome <> 'nao-e-proprietario' then
    raise exception 'a member handed the organization to themselves: %', outcome;
  end if;

  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', founder, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select public.transfer_ownership(guest_member) into outcome;
  if outcome <> 'ok' then
    raise exception 'the owner could not hand the role over: %', outcome;
  end if;

  reset role;

  select count(*) into owners from public.members
  where organization_id = org and role = 'owner';
  if owners <> 1 then
    raise exception 'after the handover the organization has % owners', owners;
  end if;

  select count(*) into seen from public.members
  where id = guest_member and role = 'owner';
  if seen <> 1 then
    raise exception 'the handover did not make the guest the owner';
  end if;

  select count(*) into seen from public.members
  where id = founder_member and role = 'admin';
  if seen <> 1 then
    raise exception 'the former owner did not stay as an administrator';
  end if;

  ------------------------------------------ e agora sai, sem levar a casa junto

  delete from auth.users where id = founder;

  select count(*) into seen from public.organizations where id = org;
  if seen <> 1 then
    raise exception 'the former owner leaving destroyed the organization';
  end if;

  -- ADR-0004 continua de pé para o caso que ele descreve: o proprietário
  -- sozinho leva a organização, porque uma organização sem membro é
  -- inalcançável para sempre.
  delete from auth.users where id = stranger;

  select count(*) into seen from public.organizations where id = stranger_org;
  if seen <> 0 then
    raise exception 'a lone owner left and their organization is still standing';
  end if;

  raise notice 'invitation is the only way in, and the owner does not leave alone';
end $$;

rollback;
