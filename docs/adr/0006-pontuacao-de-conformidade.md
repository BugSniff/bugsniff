---
status: accepted
---

# A loja ganha uma nota de conformidade, e ela contradiz o ADR-0001

O produto passa a exibir uma **pontuação de conformidade de 0 a 100** por leitura, com o detalhamento do que a compõe, na tela da loja e no relatório. Foi pedida para dar ao lojista um alvo — "chegue a 90" — em vez de uma lista de fatos que ele precisa interpretar sozinho.

Isto **contradiz** o [ADR-0001](./0001-ia-fora-do-caminho-da-conclusao.md), que diz que a saída não tem "nenhum campo onde caiba um veredito", e o [ADR-0005](./0005-sistema-visual-e-a-cor-que-nao-conclui.md), que tirou o verde da paleta porque "semáforo numa auditoria conclui o que o texto se recusa a concluir". Uma nota é o semáforo com mais resolução. Os dois ADRs continuam valendo em tudo o mais — a redação do achado, a linguagem proibida, o validador — e ficam **superados neste ponto específico**: o produto agora conclui, num lugar, de propósito, e o resto do sistema continua se recusando a concluir.

## O que a decisão custa

Uma nota é uma afirmação sobre a situação de um terceiro. "62/100 em conformidade com a LGPD", dita sobre a loja de alguém, é uma avaliação jurídica do caso concreto — o que o art. 1º, II da Lei 8.906/94 reserva à advocacia. Chamar a nota de ilustrativa não muda o que o leitor faz com ela: quem vê 62 e um alvo de 90 age como se fosse parecer, e se for multado mesmo assim, o número foi nossa afirmação.

Registrado aqui para que a decisão seja legível quando o custo aparecer, e não descoberta no código.

## Como a nota é montada, e por que assim

**Só código, nunca modelo.** Nota que um modelo produz muda entre duas execuções sobre a mesma loja, e nota que ninguém reproduz é nota com que ninguém consegue discordar. Cada ponto sai de algo que o navegador mediu.

**Quatro dimensões, cada uma amarrada a um artigo**, e nenhuma inventada para fazer o número se mexer:

**Nove dimensões, cada uma amarrada a um artigo**, e nenhuma inventada para fazer o número se mexer. Quatro saem do que o navegador observa; cinco saem do texto da política, que já guardávamos inteiro desde o #9.

| Dimensão                                    | Peso | Norma                    |
| ------------------------------------------- | ---- | ------------------------ |
| Rastreadores só depois do consentimento     | 30   | art. 7º, I e art. 8º     |
| Banner de consentimento                     | 15   | art. 8º                  |
| Política de privacidade publicada           | 10   | art. 9º                  |
| A política nomeia o que a loja usa          | 15   | art. 9º, V e art. 6º, VI |
| A política diz como revogar o consentimento | 7    | art. 8º, §5º             |
| A política identifica o controlador         | 6    | art. 9º, III             |
| A política dá um canal de contato           | 6    | art. 9º, IV              |
| A política lista os direitos do titular     | 7    | art. 9º, VII e art. 18   |
| A política informa o encarregado            | 4    | art. 41                  |

São 45 pontos para o que a loja **faz** e 55 para o que ela **declara**, que é a tese do produto sobre onde a auditoria mora. Os pesos são julgamento de produto, não de direito: a lei não os fornece. Estão num lugar só, em `lib/score.ts`, e a expectativa é que se mexam quando houver loja real para olhar.

As cinco verificações de texto são **busca por palavra, não leitura**. Uma política que diz "revogar" ganha o ponto mesmo que a frase seja sobre outra coisa — erro que corre a favor da loja, que é a direção em que uma auditoria deve errar.

**O que a leitura não conseguiu medir fica de fora, não zerado.** Uma política que nosso navegador não alcançou é falha nossa, não da loja, e cobrar por ela transformaria uma lacuna de medição em acusação. A nota é sobre o que foi medido, e o produto diz quanto foi — "medimos 85 dos 100 pontos nesta leitura".

**E sem a política lida, não sai nota nenhuma.** Metade da auditoria é a distância entre o que a loja faz e o que ela declara; sem a declaração, não há contra o que medir. Normalizar sobre o que sobrou daria a uma loja que não disparou rastreador nenhum um 100 confiante construído sobre 45% dos critérios — foi o que aconteceu com `gov.br` no primeiro teste contra dados reais, e é a forma mais lisonjeira possível de errar, justamente no número em que alguém vai agir. É a mesma postura do #34: medição que não aconteceu não é bom resultado.

**Banner não encontrado custa pontos; banner não reconhecido não.** São fatos diferentes desde o #32: um é a loja não perguntar nada, o outro é nosso navegador não conseguir responder.

## Considered Options

Duas alternativas foram propostas e recusadas pelo dono do produto:

**Comparação entre leituras** — "11 rastreadores antes do consentimento na leitura passada, 4 nesta". Dá a sensação de progresso que a nota dá, sem afirmar nada sobre legalidade, e só ficou possível depois que Loja virou entidade (#49).

**Cobertura da política** — "a política nomeia 2 dos 11 serviços observados". Razão entre dois fatos que já medimos, conferível pelo lojista no DevTools.

Ambas continuam construíveis e não competem com a nota; a nota foi escolhida porque um número único é o que orienta quem não vai ler a tabela.

## Consequences

O aviso de que o relatório não constitui parecer jurídico deixa de ser formalidade e passa a ser a única coisa que separa a nota de um parecer. Ele fica ao lado do número, não só no rodapé.

A lista de linguagem proibida do `CONTEXT.md` continua valendo para achado, e o validador continua rejeitando. A nota vive fora dele, e é por isso que ela precisou de um ADR em vez de uma issue.
