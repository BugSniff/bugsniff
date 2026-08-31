# O sistema visual, e a cor que não conclui

O produto usa shadcn/ui pelo preset `bkWtWhvox` — estilo **base-maia** sobre Base UI, base de cor **mauve**, ícones **Tabler**, corpo em **Public Sans** e títulos em **Noto Sans**. Os tokens vivem em `app/globals.css` e os componentes em `components/ui/`, gerados pelo preset e livres para editar como código nosso.

O vocabulário que o preset traz não é o shadcn "de fábrica", e vale saber de cor porque tudo se apoia nele: botão, campo e badge são **pílula** (`rounded-4xl`, 26px); card tem **anel** em vez de borda (`ring-1 ring-foreground/10`, raio 18px); cabeçalho de tabela tem 48px e peso 500 em `foreground`, não cinza; a sidebar tem 256px.

**Nenhuma cor significa conformidade.** É a regra que atravessa todas as telas, e ela é de produto, não de estética: o reflexo de dashboard é pintar o ruim de vermelho e o bom de verde, e aqui isso _é conclusão_ — vermelho ao lado de "Meta Pixel disparou antes do consentimento" diz "isto está errado", que é exatamente a frase que a [ADR-0001](./0001-ia-fora-do-caminho-da-conclusao.md) e o validador de linguagem proibida existem para impedir.

Na prática:

- O **âmbar** (`--primary`) marca ação e destaca o estado pré-consentimento. É destaque, não julgamento.
- O **vermelho** (`--destructive`) só aparece em erro de sistema e ação destrutiva: exame que não aconteceu, revogar conexão, apagar organização. Nunca perto de achado.
- **Verde não existe na paleta**, e é melhor assim.

Se a tela pinta de vermelho, todo o cuidado com a linguagem vira teatro — e num relatório white-label que a agência entrega ao lojista, é a tela que vira prova.

## Duas cascas

O funil público — home, login, link enviado, link recusado — é coluna centrada, sem sidebar: a home é uma landing com um campo, e navegação lateral ali é peso morto.

O app logado tem sidebar, com o seletor de loja no topo, as seções daquela loja abaixo dele, e o que é da organização separado no rodapé. Quem tem uma loja nunca toca no seletor e vive como se a navegação fosse plana; uma agência com quarenta troca de contexto o dia inteiro e precisa que "Documentos" signifique _desta loja_, não uma lista de quatrocentos.

A fronteira entre as duas cascas não é a URL: é a sessão. Quem clica no magic link **cai logado**, então a tela de exame nasce dentro do app.

## Considered Options

Semáforo verde/vermelho nos achados foi considerado e descartado pelo motivo acima. Uma variante mais fraca — uma cor de atenção sem par verde — também foi descartada: qualquer cor reservada para "isto é problema" reintroduz a conclusão por outro caminho.

Manter Geist, que o scaffold trazia, foi descartado junto com o preset: a tipografia veio com ele e trocar de volta significaria divergir do que os componentes assumem.

## Consequences

As telas propostas estão em `docs/design/`, geradas por `node docs/design/build.mjs` a partir de `_parts.mjs` (tokens, sidebar, componentes) e `_screens-*.mjs` (uma tela por export). Os valores das peças foram lidos de `components/ui/*`, não da memória de como shadcn costuma ser — **se o código mudar, `_parts.mjs` muda junto**, ou a proposta vira ficção.

O canvas publicado é referência de leitura, não fonte da verdade: o que manda é o que está no repositório.

A regra da cor precisa sobreviver ao primeiro pedido de "dá para destacar mais os problemas?". A resposta é destacar por tipografia, ordem e agrupamento — nunca inventando um significado de cor.
