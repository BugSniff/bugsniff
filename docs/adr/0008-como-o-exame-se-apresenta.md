---
status: accepted
---

# O exame se apresenta como o visitante que ele está medindo

O navegador do exame para de se anunciar como `HeadlessChrome`. Ele passa a usar a **própria string dele com a palavra "Headless" removida** — mesmo motor, mesma versão, mesma plataforma, uma palavra a menos. Nada é inventado: a string é lida do navegador em execução, não escrita à mão.

## O que a medição mostrou

Nove lojas brasileiras reais, cada uma aberta duas vezes, só o user agent mudando:

| loja                                       | `HeadlessChrome` | `Chrome` |
| ------------------------------------------ | ---------------- | -------- |
| centauro.com.br                            | 403              | 200      |
| netshoes.com.br                            | 403              | 200      |
| casasbahia.com.br                          | 403              | 200      |
| magazineluiza.com.br                       | 403              | 200      |
| voegol.com.br (política da smiles)         | 403              | 200      |
| havan, americanas, sephora, lustresgenesis | 200              | 200      |

**Todo 403 da amostra era a palavra.** Nenhuma loja respondeu diferente para pior.

Centauro, netshoes e casasbahia estavam no código desde o começo, num comentário que dizia que elas "respondem 403" — o exame delas voltava como `blocked`, "a loja respondeu com uma página de erro, não com a loja". A frase estava errada sobre as três. Não era a loja barrando o exame; era o exame se descrevendo de um jeito que nenhum navegador de comprador usa.

## Por que isto é sobre medição, e não sobre acesso

O produto existe para registrar **o que o navegador de um visitante brasileiro recebe**. O contexto do exame já força `pt-BR` e `America/Sao_Paulo` por esse motivo, e o comentário que justifica isso vale igual aqui: um contexto sem opções se apresenta como en-US em UTC, e isso muda o que está sendo medido.

`HeadlessChrome` é a mesma categoria de erro, e maior. Loja que responde diferente para ele está servindo ao exame uma página que **nenhum visitante vê** — o que torna a leitura não apenas incompleta, mas de outra coisa. Uma auditoria que mede a versão da loja reservada a robôs e a apresenta como a experiência do visitante está errada mesmo quando recebe 200.

Também vale nomear o que isto **não** é. Não é contornar controle de segurança, não é acessar área restrita, não é autenticação de ninguém. É o nosso navegador lendo página pública — quase sempre da loja que o próprio lojista pediu para auditar.

## Considered Options

**Continuar como `HeadlessChrome`.** Máxima honestidade, e está medido que custa 5 de 9 lojas da amostra. Nessas, o exame não acontece e a nota nunca sai.

**Nos identificarmos no user agent** — `Chrome/152 bugsniff/1.0 (+url)`. Foi testado, e é a opção que parecia certa: **403 nas mesmas URLs**. A proteção libera o que reconhece como navegador comum e recusa o resto, inclusive quem se anuncia. Não existe a porta da frente com crachá.

**Fingir um navegador que não somos** — escrever à mão uma string de Chrome de outra versão ou plataforma. Recusada: seria inventar fato sobre nós, e um exame que mente sobre si não tem como cobrar exatidão de terceiro.

## O que a decisão custa, e a contrapartida

A loja perde o único sinal que tinha para distinguir o nosso navegador do de uma pessoa pelo user agent. Isso é real e não tem como ser devolvido pelo mesmo caminho — a medição acima é a prova de que o caminho está fechado.

A contrapartida vai onde a web já guarda esse sinal: **o exame consulta `robots.txt` antes de abrir endereço fora do domínio da loja examinada**.

A distinção é a decisão inteira. As páginas da própria loja são lidas porque o dono dela pediu; um `Disallow` ali é dirigido a buscador indexando a web, não à auditoria que acabou de ser contratada, e obedecê-lo seria recusar o serviço para quem o contratou. Já a política publicada num domínio irmão é o outro caso: a smiles.com.br guarda a política dela na voegol.com.br, e ninguém na voegol pediu nada para a gente.

O que existe é uma leitura pequena de `robots.txt` — grupo `User-agent: *`, `Disallow` com `*` e `$` — e não um cliente de crawler. Ela erra para o lado de ler: arquivo que não baixa, que não responde ou que não parseia não é recusa, porque transformar problema nosso de rede em proibição que ninguém escreveu seria a mesma classe de erro que este ADR corrige.

## Consequences

O estado `blocked` do exame passa a significar o que ele sempre disse significar. Enquanto a maior parte dos 403 vinha de nós, "a loja respondeu com uma página de erro" era uma afirmação falsa sobre lojas que responderiam normalmente — e ela ia para o relatório.

Loja que continuar recusando depois disto está recusando de verdade, e aí o print que o exame guarda é a prova.
