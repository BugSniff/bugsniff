-- O painel de agência: muitas lojas de muitos clientes, numa organização só.
--
-- A organização não muda de forma aqui. Uma agência com quarenta lojas e um
-- lojista com uma são a mesma entidade — o CONTEXT.md diz isso desde o começo, e
-- o que faltava não era uma tabela nova, era como agrupar, ordenar e examinar em
-- lote o que já existia.

/*
 * De qual cliente é esta loja.
 *
 * Um rótulo, e não uma entidade. `Cliente` não existe no glossário e não vai
 * existir por causa desta tela: uma tabela `clients` traria id, nome, contato e
 * a pergunta de quem pode editá-la, para resolver "agrupar quarenta lojas em
 * doze linhas". O dia em que um cliente precisar ter contato próprio, cobrança
 * própria ou acesso próprio, aí ele vira entidade — e aí a coluna vira chave.
 *
 * Nulo é a maioria dos casos: o lojista com uma loja nunca preenche isto, e a
 * lista dele não deve ganhar um cabeçalho "Sem cliente" por causa da agência.
 */
alter table public.stores add column client text;

create index stores_client_idx on public.stores (organization_id, client);

/*
 * A primeira escrita permitida sobre `stores`, e ela é de uma coluna só.
 *
 * `host` é a identidade da loja: as leituras penduram nele, e deixar alguém
 * editá-lo reescreveria a história de uma loja para outra. A policy diz *quem*
 * pode escrever; quem diz *o quê* é o grant por coluna.
 *
 * O `revoke` antes dele não é cerimônia. O Supabase concede `update` na tabela
 * inteira a `anon` e `authenticated` por padrão, contando com a RLS para segurar
 * tudo — então um `grant update (client)` sozinho não restringe nada: a
 * permissão mais ampla já estava lá, e a primeira versão disto deixou passar um
 * `update stores set host = ...`. Tirar a permissão da tabela é o que faz a
 * permissão da coluna significar alguma coisa.
 */
revoke update on public.stores from anon, authenticated;
grant update (client) on public.stores to authenticated;

create policy "admins name the client of their own stores"
  on public.stores for update to authenticated
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

/*
 * O que a leitura encontrou de novo, guardado em vez de enviado na hora.
 *
 * O #19 mandava um e-mail por exame que mudasse. Numa agência com quarenta
 * lojas isso é quarenta e-mails numa manhã, que é o mesmo que zero e-mails —
 * ninguém lê o trigésimo. Então a leitura **registra** o que apareceu, e quem
 * termina por último na organização manda um aviso só, cobrindo todas.
 *
 * `alerted_at` é o que impede o mesmo achado de sair duas vezes: o aviso marca
 * o que cobriu, e a próxima varredura só olha o que ficou sem marca. Também é o
 * que faz uma execução que morreu no meio se recuperar sozinha — o que não foi
 * avisado hoje entra no aviso de amanhã.
 */
alter table public.scans
  add column appeared jsonb,
  add column alerted_at timestamptz;

create index scans_unalerted_idx on public.scans (organization_id)
  where appeared is not null and alerted_at is null;

/*
 * Examinar todas as lojas da organização de uma vez.
 *
 * O mesmo desenho de `enqueue_monitoring_scans` e pelas mesmas razões: a
 * decisão de quais lojas entram é uma instrução só, no banco, então duas
 * execuções simultâneas não enfileiram a mesma loja duas vezes. A diferença é
 * que aqui não há data de vencimento — alguém clicou, e o que se respeita é
 * apenas o que já está em voo.
 *
 * `monitored` fica falso: alguém pediu isto. É o que decide se o aviso sai, e
 * mandar e-mail sobre um lote que a pessoa está olhando rodar é ruído.
 */
create function public.enqueue_organization_scans(org uuid)
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.scans (organization_id, store_id, url, status, pending_at)
  select s.organization_id, s.id, 'https://' || s.host,
         'pending'::public.scan_status, now()
  from public.stores s
  where s.organization_id = org
    and public.is_member_of(org)
    and not exists (
      select 1 from public.scans q
      where q.store_id = s.id
        and q.status in (
          'awaiting_confirmation'::public.scan_status,
          'pending'::public.scan_status,
          'running'::public.scan_status
        )
    )
  returning id;
$$;

-- Chamada pelo produto com a sessão de quem clicou, e é ela própria que checa a
-- participação: `is_member_of` dentro do WHERE é o que impede alguém de mandar
-- examinar — e faturar — as lojas de outra organização.
revoke execute on function public.enqueue_organization_scans(uuid)
  from public, anon;
