---
status: accepted
---

# O proprietário não sai sem repassar o papel, e é o banco que recusa

Emenda o [ADR-0004](./0004-organizacao-morre-com-seu-proprietario.md), que continua valendo para o caso que ele descreve.

Excluir o proprietário continua excluindo a organização **quando ele está sozinho nela** — a razão original não mudou: uma organização sem membro é inalcançável para sempre, porque toda leitura passa por `is_member_of`. Mas a partir do convite existe um segundo caso, e nele a mesma regra faz o oposto do que se pretendia: excluir uma pessoa derruba, calado, uma conta com as lojas de outra dentro.

Então: **excluir o proprietário de uma organização com mais de um membro é recusado**, com erro, até que ele repasse o papel a outro membro. O repasse é `transfer_ownership`, e quem sai fica como administrador.

## A parte que muda de lugar: o ADR-0004 dizia "na UI, não no banco"

A previsão estava certa e o endereço estava errado. O `Consequences` do ADR-0004 antecipou exatamente este momento e propôs resolvê-lo como "regra de produto, na UI".

Uma regra de tela só governa os deletes que passam pela tela. Os que importam não passam: o painel do Supabase, um script de suporte apagando uma conta a pedido do titular, a limpeza noturna de contas não confirmadas, um `delete from auth.users` digitado às pressas num incidente. São exatamente as situações em que ninguém está olhando a consequência, e o resultado seria uma agência perdendo as quarenta lojas dos clientes dela porque alguém apagou um usuário.

A recusa é um trigger `before delete` em `auth.users` — na pessoa, e não em `members`. Uma regra sobre `members` dispararia também quando a organização inteira é apagada e os membros caem por cascade, e passaria a impedir a exclusão legítima de uma organização.

## Consequences

**A limpeza noturna passa a desviar.** Um `delete` em lote que esbarre num proprietário acompanhado aborta inteiro, e a limpeza de todo mundo pararia por causa de uma linha, de madrugada, sem ninguém saber. O cron de contas não confirmadas ganhou um `not exists` que pula esses casos. Qualquer exclusão em lote escrita daqui em diante precisa do mesmo cuidado — a alternativa é uma rotina que falha calada.

**Uma pessoa pertence a uma organização só.** Não é uma decisão deste ADR, é o que o produto inteiro já assumia — o painel, o formulário de exame e o callback do magic link leem "a organização" no singular. O convite respeita isso: quem chega convidado não ganha organização própria, e quem já tem uma vazia troca-a pela do convite. Quem já tem uma **com lojas dentro** é recusado com o motivo, porque aceitar significaria abandonar as lojas dele e isso não se faz por conta própria.

Pertencer a várias organizações é trabalho de outra issue, e o que falta para ele é um seletor de organização atual — não um modelo de dados diferente.

**`admin` deixou de ser um papel sem significado.** O enum `member_role` sempre teve os três valores e ninguém tinha dito o que o do meio podia. Agora pode convidar e remover membro, e não pode repassar a propriedade nem levar a organização junto ao sair. A linha entre os dois papéis é essa: o administrador mexe em quem entra e quem sai, o proprietário mexe em quem manda.

**A garantia é verificada por `supabase/tests/invites-and-ownership.sql`**, que cobre as duas metades no mesmo arquivo de propósito: convite sem repasse cria exatamente o estado que o ADR-0004 nomeia como perigoso, e testar as duas em separado deixaria qualquer uma passar com o par quebrado.
