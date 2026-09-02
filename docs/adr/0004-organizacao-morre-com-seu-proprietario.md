---
status: amended
---

# A organização morre com seu proprietário

> Emendado pelo [ADR-0009](./0009-o-proprietario-nao-sai-sozinho.md): continua valendo para o proprietário **sozinho**. Com outra pessoa dentro, excluí-lo passou a ser recusado — pelo banco, e não pela UI como o `Consequences` abaixo previa.

Quem cria a conta cria a organização e nasce proprietário dela. Excluir o proprietário exclui a organização, e a organização leva os membros restantes por cascade. Membro comum sai sozinho e a organização segue de pé.

A regra existe para que nunca haja organização sem membro. Uma organização sem membro não fica dormente: ela fica **inalcançável para sempre**, porque toda leitura passa por `is_member_of` e não existe policy de insert em `members` para recolocar alguém. Seria uma linha que ninguém pode ler, editar nem apagar pelo produto.

## Considered Options

Deixar a organização sobreviver à pessoa foi a leitura inicial, e tem apoio no glossário: a organização é _a conta que agrupa lojas e membros_, e o membro é _pessoa com acesso a uma organização_ — apagar uma pessoa não deveria apagar uma conta. Foi descartado porque hoje a organização nasce junto com o primeiro membro e por ora é um-para-um com ele: manter a conta de pé sem ninguém dentro não preserva nada, só acumula linha órfã.

Cascade por chave estrangeira, com uma coluna `owner_id` em `organizations`, foi considerado e descartado: guardaria numa coluna da organização um papel que já vive em `members.role`. Duas fontes para o mesmo fato divergem.

## Consequences

Enquanto uma organização for uma pessoa, isso está correto. Quando houver convite e organização com vários membros, **passa a ser perigoso**: excluir o proprietário derrubaria calado uma conta com lojas de terceiros dentro. A partir daí, excluir um proprietário tem de exigir que ele repasse o papel a outro membro antes — regra de produto, na UI, não no banco. O trigger carrega um comentário `ponytail:` nomeando esse teto.

A garantia é verificada por `supabase/tests/organization-lifecycle.sql`, que cobre os dois lados: membro comum saindo não derruba a organização, proprietário saindo derruba. O caso do proprietário acompanhado está em `supabase/tests/invites-and-ownership.sql`.
