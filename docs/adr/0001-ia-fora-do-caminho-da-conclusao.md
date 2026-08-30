# A IA escreve o achado, mas não conclui

O diagnóstico é redigido por um modelo de linguagem, e não por template fixo, porque a redação template a template não cobre a variedade de lojas reais. Para que isso não transforme o produto em consultoria jurídica automatizada, a saída do modelo é estruturada **sem nenhum campo onde caiba um veredito** — só fato observado, evidência, norma citada e trecho de origem — e um validador determinístico rejeita achado com linguagem conclusiva ou com citação que não corresponde ao texto-fonte fornecido.

## Considered Options

Deixar o modelo escrever o achado livremente, incluindo a conclusão, foi a primeira preferência e é claramente mais simples. Foi descartado porque a conclusão sobre o caso concreto de um cliente é justamente o que o art. 1º, II da Lei 8.906/94 reserva à advocacia, e um prompt não é garantia: ele falha silenciosamente, numa loja entre mil, sem ninguém ver.

## Consequences

A postura jurídica do produto passa a ser imposta por código, não por instrução ao modelo — o validador é o teste de prioridade máxima do repositório, e se ele falhar nada mais importa. O texto das normas é sempre fornecido ao modelo como fonte no contexto; citação recuperada da memória dele é rejeitada por não ter trecho correspondente.
