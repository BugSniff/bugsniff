---
status: accepted
---

# O banner é código inteiro na loja, não script hospedado por nós

O banner de consentimento que o produto gera é entregue como **um arquivo completo, para colar no tema da loja**. Não é um `<script src>` apontando para um endereço nosso. Ele não faz nenhuma requisição para o bugsniff, não manda telemetria, e guarda a escolha do visitante num cookie de primeira parte no domínio da própria loja.

A alternativa era óbvia e é o que a categoria toda faz: servir um loader de uma CDN nossa, atualizar o comportamento sem ninguém colar nada de novo, e medir instalação e taxa de aceite. Foi recusada por três motivos, em ordem de peso.

**O primeiro é que ela nos transformaria no maior terceiro da loja do nosso cliente.** Um script nosso em toda página de toda loja auditada vê cada visitante de cada cliente chegar — endereço, IP, referrer, horário. O produto existe para escrever, sobre a loja de alguém, "este endereço foi contactado antes de qualquer interação com o banner". Instalar exatamente isso é fazer o exame seguinte encontrar `bugsniff` na leitura pré-consentimento da loja que acabamos de auditar. Não há redação que sustente essa posição.

**O segundo é que a conformidade da loja passaria a depender do nosso uptime.** CDN fora do ar tem duas saídas, e as duas são ruins: ou o banner não aparece e os rastreadores disparam — a loja fica pior do que antes de nos contratar —, ou o bloqueio é aplicado por um script que não carregou, o que é dizer que não é aplicado. Um arquivo colado no tema não tem esse modo de falha.

**O terceiro é que ninguém pode revisar o que não pode ler.** O código é entregue sendo lido: o lojista cola, ou o desenvolvedor dele confere antes de deixar colar. É por isso que o runtime vive como texto em `packages/consent-banner/lib/runtime.ts` e não como módulo compilado — um bundle minificado põe um artefato entre o que escrevemos e o que roda na loja, e uma ferramenta de auditoria que pede para você instalar código opaco na sua vitrine está pedindo justamente a confiança que ela passa o dia dizendo para você não dar.

## O que a decisão custa

**Atualizar é colar de novo.** Correção no runtime não chega a quem já instalou. Rastreador novo encontrado num exame novo também não: a lista de bloqueio dentro do arquivo colado é a de quando ele foi gerado.

**Não sabemos se está instalado.** Sem telemetria, o painel não pode dizer "banner ativo". O que substitui isso é a medição que já existe e é melhor: o exame seguinte abre a loja e lê. Se o banner funciona, a leitura pré-consentimento fica vazia — que é o efeito, não a alegação.

**Não sabemos o que os visitantes escolheram.** Taxa de aceite é um número que a categoria vende e que este produto não terá. Perda comercial real, e aceita: o dado só existiria se a escolha do visitante trafegasse até nós.

## Dois limites que o código não resolve, e são ditos em voz alta

**Cookie que o servidor da loja manda no cabeçalho da resposta.** Nenhum script na página desfaz um `Set-Cookie`. O que o runtime faz é expirar, na carga seguinte, os cookies da lista que já estavam lá — quem instalou o banner depois de um ano rastreando não fica com o identificador antigo no navegador do visitante.

**Tag escrita à mão no tema.** Um `<script src>` de terceiro dentro do HTML é buscado pelo parser antes de qualquer JavaScript rodar; nada em JavaScript se põe na frente disso. O runtime tira o `src` do nó quando ele aparece, o que impede a execução mas não desfaz a requisição.

Os dois se resolvem pela instalação via plataforma (#14 a #17), que reescreve o tema. Até lá são limites, e estão escritos na tela que entrega o código e dentro do arquivo gerado — não só aqui.

## Consequences

**A geração é determinística.** Nada de data nem de aleatório entra no arquivo: mesma leitura e mesmas configurações, mesmos bytes. É o que permite comparar o que está na vitrine com o que está na nossa tela e ver se é o mesmo.

**A lista de bloqueio não é coluna no banco.** Ela é derivada da leitura mais recente contra a tabela `trackers` como ela está agora, a cada geração — mesmo motivo pelo qual o relatório nomeia rastreador em tempo de leitura. Coluna seria essa lista envelhecendo num lugar onde ninguém olha.

**A escolha é gravada e a página recarrega.** O que foi bloqueado foi bloqueado por nunca ter sido criado, então não existe "liberar" sem uma carga nova. Recarregar também é o que faz a recusa valer inteira: a limpeza dos cookies antigos roda desde o começo.

**Os três botões saem iguais**, e isso não é configurável. Aceitar, recusar e escolher têm o mesmo tamanho, peso e cor — o canvas em `docs/design/` propunha a recusa em `outline` e o aceite preenchido, e essa parte da proposta foi descartada: banner com aceite mais visível que a recusa é o achado que este produto escreve sobre a loja dos outros.
