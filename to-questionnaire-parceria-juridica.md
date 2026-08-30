# Conformidade LGPD em e-commerce: viabilidade jurídica e parceria

**Propósito:** estamos avaliando construir uma ferramenta que audita lojas virtuais brasileiras quanto ao uso de cookies e à consistência da política de privacidade. Quatro decisões de produto dependem de respostas que só um advogado pode dar, e nenhuma delas pode ser tomada por analogia ou pesquisa própria. As respostas abaixo definem se o produto existe, em que redação, e se há espaço para uma parceria remunerada.

**De:** Filipe Prado · **Para:** você · **Como suas respostas serão usadas:** para escrever a especificação técnica do produto e, se fizer sentido para os dois lados, para desenhar uma proposta de parceria. Nada será publicado nem atribuído a você sem sua autorização expressa.

## Contexto

A ferramenta funciona assim: o lojista informa a URL da loja; um navegador automatizado abre o site, registra quais cookies e pixels de rastreamento disparam (Meta, Google Ads, TikTok, Hotjar) e em que momento — antes ou depois do clique em "aceitar" no banner de consentimento. Em seguida, o sistema lê a política de privacidade publicada no site e compara: os rastreadores encontrados estão declarados no texto? O resultado é um relatório para o lojista. Numa camada paga superior, pretendemos oferecer revisão e parecer de um advogado — daí este questionário. Duas informações de contexto que já levantamos: a ANPD aplicou uma única sanção a empresa privada até hoje (R$ 14.400), e o Guia Orientativo de Cookies da ANPD afirma que o legítimo interesse "dificilmente será a hipótese legal mais apropriada" para cookies de publicidade de terceiros.

## Como responder

Estimamos **cerca de uma hora**, assíncrono — responda no seu ritmo, direto no arquivo ou por e-mail. Não há prazo rígido; se puder até o fim da semana, ajuda.

Respostas parciais são úteis. **"Não sei" e "isso é controverso" são respostas válidas e importantes** — prefiro saber que um ponto é incerto do que recebê-lo em branco. Se alguma pergunta estiver mal formulada por ignorância minha do assunto, me diga isso em vez de respondê-la.

## 1. A tese jurídica se sustenta?

O produto inteiro parte da premissa de que disparar pixel de publicidade antes do consentimento é irregular. Se essa premissa não se sustenta, não há produto.

### Cookies de terceiros para publicidade (Meta Pixel, Google Ads) exigem consentimento prévio do titular no Brasil, ou o legítimo interesse do art. 7º, IX da LGPD cobre esse uso?

_Por que importa: é a afirmação central de todo relatório que a ferramenta emitir._

>

### O Guia Orientativo de Cookies da ANPD tem força vinculante, ou é soft law que orienta a fiscalização sem criar obrigação exigível?

>

### Uma loja cujo pixel dispara antes do clique em "aceitar" está descumprindo a LGPD, ou apenas desalinhada de uma recomendação de boa prática?

_Por que importa: define se o relatório pode falar em "descumprimento" ou apenas em "desalinhamento"._

>

### Se a política de privacidade não menciona nominalmente Meta e Google como destinatários dos dados, qual dispositivo isso viola especificamente?

>

### Para um e-commerce faturando R$ 50 mil/mês, qual é o vetor de risco realmente provável hoje: ANPD, Procon, Ministério Público, ou ação individual de consumidor?

_Por que importa: decide se vendemos prevenção de multa ou outra coisa. Prefiro sua leitura honesta do risco real a uma lista do que é teoricamente possível._

>

## 2. Onde está a linha do exercício ilegal da advocacia

Planejamos que o relatório automatizado nunca conclua sobre a situação do cliente — apenas aponte fatos e cite a norma. Preciso saber se essa fronteira é suficiente.

### Um relatório automatizado que afirma "o cookie `_fbp` (Meta) dispara antes do consentimento e não consta da sua política de privacidade; o Guia da ANPD orienta que cookies de consentimento fiquem desativados por padrão" é constatação técnica ou consultoria jurídica na acepção do art. 1º, II da Lei 8.906/94?

>

### Que palavra ou construção transforma uma constatação em parecer? Se puder, me dê um exemplo de redação que você considera seguro e um que considera arriscado.

_Por que importa: essa resposta vira literalmente o padrão de escrita do sistema. Exemplos concretos valem mais que o critério abstrato._

>

### Gerar Política de Privacidade e Termos de Uso por software, sem revisão de advogado, configura exercício ilegal da advocacia? A resposta muda se o software é cobrado, e muda pelo fato de Nuvemshop e Shopify já oferecerem geradores gratuitos aos seus lojistas?

>

### Um aviso de isenção ("este relatório não constitui parecer jurídico") protege de fato, ou a proteção real vem de limitar o que o produto afirma?

_Por que importa: se o disclaimer não protege, paramos de contar com ele e mudamos o produto._

>

## 3. O selo: viabilidade e responsabilidade

A camada paga superior seria: você revisa o caso e assina um parecer atestando conformidade.

### Você conseguiria emitir parecer sobre uma loja cuja auditoria técnica foi feita por um software que você não operou? O que precisaria verificar por conta própria antes de assinar?

>

### Que parte desse trabalho é irredutível — ou seja, o que a automação nunca vai poder tirar de você?

_Por que importa: define o piso de custo do serviço e se ele escala ou não._

>

### Se o cliente for autuado depois do parecer assinado, a responsabilidade recai sobre você profissionalmente, ou respinga na empresa que produziu o diagnóstico automatizado?

>

### Seu seguro de responsabilidade civil profissional cobriria parecer emitido nesse formato, com diagnóstico de origem automatizada?

>

### O Provimento 205/2021 da OAB restringe publicidade da advocacia. Seu nome e número de inscrição poderiam aparecer no site do produto e no material comercial como "revisado por advogado"? Que formatos são permitidos e quais não são?

_Por que importa: é decisão de produto, não detalhe de marketing. Se o selo não pode ser mostrado, ele perde grande parte do valor comercial._

>

## 4. Condições comerciais

Só relevante se as seções anteriores não inviabilizarem o desenho.

### Quanto você cobraria por revisão de um caso (relatório de scan + política + termos), e quanto tempo leva por caso?

>

### Quantas revisões por mês você absorveria sem prejudicar sua operação atual?

_Por que importa: é o teto de crescimento dessa camada do produto._

>

### Que modelo de remuneração funciona para você: honorário por caso, retainer mensal, ou participação na receita dessa camada?

>

### Existe impedimento ético ou estatutário em advogado receber participação na receita de uma empresa de software — captação de clientela, sociedade com não-advogado (art. 16 do EAOAB), ou algo correlato?

_Por que importa: pode eliminar o modelo de participação antes de o discutirmos._

>

## Mais alguma coisa?

Há algo que eu não perguntei e deveria ter perguntado? Algum risco, restrição ou oportunidade que fica óbvio para quem é da área e invisível para quem não é?

>
