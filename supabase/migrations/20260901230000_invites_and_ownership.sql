-- Convite e repasse de propriedade: a primeira escrita que este schema permite.
--
-- Até aqui `organizations` e `members` não tinham policy de insert, update nem
-- delete: escrita era negada por padrão, sem exceção, e a organização nascia por
-- trigger rodando como definer. Este arquivo abre a primeira exceção, e por isso
-- o desenho das policies é o trabalho, não um detalhe dele.
--
-- As duas metades andam juntas de propósito. O ADR-0004 estabelece que excluir
-- o proprietário exclui a organização, e que a organização leva os membros
-- restantes — correto **enquanto uma organização for uma pessoa**. No instante
-- em que existe convite, deixa de ser: excluir o proprietário passa a derrubar,
-- calado, uma conta com as lojas de outra pessoa dentro. Entregar convite sem o
-- repasse criaria exatamente o estado que aquele ADR nomeia como perigoso.

/*
 * Exatamente um proprietário por organização, garantido pelo índice.
 *
 * O repasse são dois UPDATEs — rebaixa quem sai, promove quem entra — e duas
 * escritas que precisam valer juntas são o lugar clássico de a invariante
 * quebrar: uma policy pode autorizar cada uma delas isoladamente e ainda assim
 * deixar a organização com dois proprietários ou nenhum. Nenhuma policy
 * consegue expressar "exatamente um"; um índice único, sim.
 *
 * Também é a rede sob a exclusão: uma organização sem proprietário é uma
 * organização que ninguém pode repassar, esvaziar nem apagar pelo produto.
 */
create unique index members_one_owner
  on public.members (organization_id)
  where role = 'owner';

/*
 * O papel de quem está pedindo, dentro de uma organização.
 *
 * SECURITY DEFINER pelo mesmo motivo de `is_member_of`: ler `members` de dentro
 * de uma policy sobre `members` recursaria. Roda como definer, responde sobre o
 * próprio uid de quem chama, e nunca devolve linha.
 */
create function public.role_in(org uuid)
returns public.member_role
language sql
security definer
stable
set search_path = ''
as $$
  select m.role
  from public.members m
  where m.organization_id = org
    and m.user_id = (select auth.uid());
$$;

/*
 * Quem pode administrar a organização: o proprietário e o administrador.
 *
 * O `admin` existia no enum desde o começo sem ninguém ter dito o que ele pode,
 * e papel sem poder definido é adivinhação para quem chega depois. Aqui ele
 * ganha exatamente dois poderes — convidar e remover membro — e nenhum sobre a
 * própria existência da organização: repassar a propriedade e ser excluído
 * levando tudo junto continuam sendo só do proprietário.
 *
 * A linha entre os dois é essa: o administrador mexe em quem entra e quem sai,
 * o proprietário mexe em quem manda.
 */
create function public.is_admin_of(org uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select public.role_in(org) in ('owner', 'admin');
$$;

/*
 * O convite: permissão emitida para que alguém se torne membro.
 *
 * Entidade própria e não linha em `members` sem confirmação. O CONTEXT.md já
 * define Convite como permissão emitida, não como membro, e a diferença é
 * operacional: `members` é lido por `is_member_of`, e `is_member_of` é
 * atravessado por toda policy deste banco. Guardar convidado ali significaria
 * que todo controle de acesso do produto passa a depender de um filtro
 * `accepted_at is null` estar certo em toda parte, para sempre. Uma tabela
 * separada não tem como esquecer o filtro.
 */
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- O endereço é a identidade do convite: quem prova a posse dele entra.
  -- Guardado normalizado para que `Maria@Loja.com` e `maria@loja.com` não sejam
  -- dois convites, e o check é o que impede alguém de gravar sem normalizar.
  email text not null check (email = lower(email) and email like '%_@_%'),

  -- Capacidade portadora sobre o convite. Separado de `id` pela mesma razão de
  -- `scans.claim_token`: id acaba em link, log e tela de administração, e o dia
  -- em que isso acontece um id que também é capacidade entrega o convite a quem
  -- o leu.
  token uuid not null default gen_random_uuid(),

  -- Quem convidou, para a tela poder dizer. Aponta para o membro e não para o
  -- usuário: se a pessoa sai da organização, o convite que ela emitiu sai com
  -- ela — um convite pendente de quem não está mais lá não é permissão de
  -- ninguém.
  invited_by uuid not null references public.members (id) on delete cascade,

  created_at timestamptz not null default now(),

  -- Convite pendente expira. Sem senha, a caixa de entrada é a conta, e um
  -- convite eterno numa caixa abandonada é uma porta aberta para sempre.
  expires_at timestamptz not null default now() + interval '7 days',

  accepted_at timestamptz,

  -- Um convite aberto por endereço por organização. Convidar duas vezes é
  -- reenviar, não acumular.
  unique (organization_id, email)
);

create index invites_token_idx on public.invites (token);
create index invites_email_idx on public.invites (email) where accepted_at is null;

alter table public.invites enable row level security;

-- Quem administra vê os convites da própria organização, e mais ninguém. O
-- convidado não lê esta tabela: ele chega pelo token, por um caminho que roda
-- como definer, porque no instante em que ele lê o convite ele ainda não é
-- membro de nada — não há `is_member_of` que o alcance.
create policy "admins read invites of their own organizations"
  on public.invites for select to authenticated
  using (public.is_admin_of(organization_id));

/*
 * A primeira policy de insert deste banco.
 *
 * Duas condições, e a segunda é a que não é óbvia. `is_admin_of` diz que quem
 * escreve manda naquela organização. `invited_by` diz que ele assinou com o
 * próprio nome: sem essa checagem, um administrador poderia emitir um convite
 * assinado por outra pessoa da equipe, e a tela que mostra "convidado por"
 * estaria mostrando uma mentira que o banco aceitou.
 */
create policy "admins invite into their own organizations"
  on public.invites for insert to authenticated
  with check (
    public.is_admin_of(organization_id)
    and invited_by in (
      select m.id from public.members m
      where m.organization_id = invites.organization_id
        and m.user_id = (select auth.uid())
    )
  );

-- Revogar é apagar. Não existe policy de update: um convite não se edita, e
-- aceitar é feito por função definer — deixar o cliente escrever `accepted_at`
-- seria deixá-lo se declarar membro.
create policy "admins revoke invites of their own organizations"
  on public.invites for delete to authenticated
  using (public.is_admin_of(organization_id));

/*
 * Remover membro. A primeira policy de delete sobre `members`.
 *
 * Dois caminhos, e nenhum deles alcança o proprietário: quem administra remove
 * quem não é proprietário, e qualquer pessoa sai por vontade própria. O
 * proprietário não sai por aqui — ele repassa o papel primeiro, e é isso que
 * `transfer_ownership` existe para fazer.
 *
 * A exclusão da linha de `members` não apaga a pessoa: ela continua com conta,
 * e a organização própria dela é outra história (não tem uma — ver
 * `handle_new_user`). Sair de uma organização é ficar sem nenhuma, o que hoje
 * significa uma conta que não vê nada. É o preço de uma pessoa pertencer a uma
 * organização só, e está nomeado no CONTEXT.md.
 */
create policy "admins remove members, and anyone leaves"
  on public.members for delete to authenticated
  using (
    role <> 'owner'
    and (
      public.is_admin_of(organization_id)
      or user_id = (select auth.uid())
    )
  );

/*
 * Aceitar um convite estando já com conta.
 *
 * Quem nunca teve conta não passa por aqui: `handle_new_user` já o coloca na
 * organização certa quando o cadastro acontece com um convite pendente para
 * aquele endereço, e por isso ele nunca chega a ter organização própria.
 *
 * Esta função é para o outro caso — a pessoa que já se cadastrou sozinha e
 * depois foi convidada pela agência. Ela tem organização própria, e o produto
 * inteiro assume que uma pessoa pertence a uma organização só. Então o convite
 * troca uma pela outra, e a troca só é permitida quando não destrói nada: uma
 * organização com loja dentro é recusada, com o motivo, em vez de apagada.
 *
 * Os códigos devolvidos são chaves, nunca frases. A frase vive na tela que a
 * mostra, e um texto que atravessa a URL é um texto que qualquer pessoa pode
 * escrever.
 */
create function public.accept_invite(invite_token uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
  invite public.invites;
  own_organization uuid;
  stores_left int;
begin
  if caller is null then
    return 'sem-sessao';
  end if;

  select u.email into caller_email from auth.users u where u.id = caller;

  select * into invite
  from public.invites i
  where i.token = invite_token
  for update;

  if not found then
    return 'inexistente';
  end if;

  if invite.accepted_at is not null then
    return 'usado';
  end if;

  if invite.expires_at < now() then
    return 'expirado';
  end if;

  -- O convite é para um endereço, e a prova de posse do endereço é a sessão.
  -- Sem esta linha, o token seria a permissão inteira e quem o lesse por cima do
  -- ombro entraria na organização de outra pessoa.
  if lower(caller_email) <> invite.email then
    return 'outro-endereco';
  end if;

  if public.is_member_of(invite.organization_id) then
    return 'ja-e-membro';
  end if;

  select m.organization_id into own_organization
  from public.members m
  where m.user_id = caller
  limit 1;

  if own_organization is not null then
    select count(*) into stores_left
    from public.stores s
    where s.organization_id = own_organization;

    if stores_left > 0 then
      return 'organizacao-com-lojas';
    end if;

    -- Vazia: some, e leva a linha de membro por cascade. Nada se perde, e a
    -- pessoa passa a pertencer a uma organização só, como o resto do produto
    -- assume.
    delete from public.organizations where id = own_organization;
  end if;

  insert into public.members (organization_id, user_id, role)
  values (invite.organization_id, caller, 'member');

  update public.invites set accepted_at = now() where id = invite.id;

  return 'ok';
end;
$$;

/*
 * Repassar a propriedade.
 *
 * Dois UPDATEs e a ordem não é livre: `members_one_owner` é verificado a cada
 * instrução, então promover antes de rebaixar deixaria dois proprietários por um
 * instante e o índice recusaria. Rebaixa-se primeiro.
 *
 * Quem sai vira `admin` e não `member`. Repassar o papel é escolher quem manda,
 * não abrir mão de tudo no mesmo gesto — e o caminho para sair de vez continua
 * existindo depois, agora sem levar a organização junto.
 */
create function public.transfer_ownership(to_member uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.members;
begin
  select * into target from public.members m where m.id = to_member;

  if not found then
    return 'inexistente';
  end if;

  -- Só o proprietário repassa. Um administrador que pudesse fazer isto poderia
  -- promover a si mesmo, que é o mesmo que não haver proprietário.
  if public.role_in(target.organization_id) <> 'owner' then
    return 'nao-e-proprietario';
  end if;

  if target.user_id = caller then
    return 'para-si-mesmo';
  end if;

  update public.members
  set role = 'admin'
  where organization_id = target.organization_id
    and user_id = caller;

  update public.members set role = 'owner' where id = to_member;

  return 'ok';
end;
$$;

/*
 * Excluir o proprietário de uma organização com mais gente dentro é recusado.
 *
 * Aqui e não numa regra de tela. O ADR-0004 previa isto como "regra de produto,
 * na UI, não no banco", e essa leitura não sobrevive ao convite: o delete que
 * importa não vem da nossa tela. Vem do painel do Supabase, de um script de
 * limpeza, de um suporte apagando uma conta — caminhos onde nenhuma regra de UI
 * roda, e onde o resultado seria uma organização com as lojas de terceiros
 * dentro derrubada sem nada avisar.
 *
 * Em `auth.users` e não em `members` de propósito: o que se está recusando é
 * apagar a **pessoa**. Uma regra sobre `members` dispararia também quando a
 * organização inteira é apagada e os membros caem por cascade, e passaria a
 * impedir a exclusão legítima de uma organização.
 */
create function public.refuse_to_orphan_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization uuid;
begin
  select m.organization_id into organization
  from public.members m
  where m.user_id = old.id
    and m.role = 'owner'
    and exists (
      select 1 from public.members other
      where other.organization_id = m.organization_id
        and other.user_id <> old.id
    )
  limit 1;

  if organization is not null then
    raise exception
      'owner of organization % still has company: hand the role over first',
      organization
      using errcode = 'restrict_violation';
  end if;

  return old;
end;
$$;

create trigger before_owner_deleted
  before delete on auth.users
  for each row execute function public.refuse_to_orphan_organization();

/*
 * Quem chega convidado não ganha organização própria.
 *
 * Sem isto, o convidado nasceria proprietário de uma organização vazia e membro
 * da organização que o convidou — duas, quando o produto inteiro assume uma. E
 * a organização vazia dele ficaria para sempre, porque nada a apaga.
 *
 * O token do convite não entra aqui, e não precisa: o convite é para um
 * endereço, e o cadastro por magic link **é** a prova de posse daquele endereço.
 * Quem completou o cadastro com o e-mail convidado já provou tudo o que o token
 * provaria.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
  invite public.invites;
begin
  select * into invite
  from public.invites i
  where i.email = lower(new.email)
    and i.accepted_at is null
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;

  if found then
    insert into public.members (organization_id, user_id, role)
    values (invite.organization_id, new.id, 'member');

    update public.invites set accepted_at = now() where id = invite.id;

    return new;
  end if;

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

-- Chamadas pelo produto com a sessão de quem pede: elas próprias checam o papel
-- de quem chama, e é para isso que são definer. As auxiliares de policy não são
-- para ninguém chamar de fora.
revoke execute on function public.role_in(uuid) from public, anon;
revoke execute on function public.is_admin_of(uuid) from public, anon;
revoke execute on function public.refuse_to_orphan_organization()
  from public, anon, authenticated;

/*
 * A limpeza noturna passa a desviar de quem não pode ser apagado.
 *
 * O trigger acima recusa apagar proprietário acompanhado, e um `delete` em lote
 * que esbarre num deles aborta inteiro — a limpeza de todo mundo pararia por
 * causa de uma linha, silenciosamente, de madrugada. É um caso que quase não
 * acontece (quem nunca confirmou o e-mail nunca teve sessão para convidar
 * alguém), e "quase" não é o tipo de garantia que se deixa num cron.
 */
select cron.unschedule('delete-unconfirmed-accounts');

select cron.schedule(
  'delete-unconfirmed-accounts',
  '17 4 * * *',
  $$
    delete from auth.users u
    where u.email_confirmed_at is null
      and u.created_at < now() - interval '3 days'
      and not exists (
        select 1
        from public.members m
        join public.members other
          on other.organization_id = m.organization_id
         and other.user_id <> m.user_id
        where m.user_id = u.id and m.role = 'owner'
      )
  $$
);
