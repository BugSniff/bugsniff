# LGPD Sentinel — pesquisa de validação

**Data:** 29/08/2026
**Método:** fontes primárias apenas (políticas oficiais Google/Meta, gov.br/ANPD, Planalto, docs de dev Shopify/Nuvemshop/WordPress, páginas de preço dos próprios fornecedores, app stores oficiais, OAB). Onde só existe fonte secundária, isso está marcado explicitamente.

**Produto avaliado:** SaaS B2B para lojista brasileiro não-técnico (Shopify, Nuvemshop, WooCommerce, Wix) faturando R$10k–500k/mês. Quatro módulos: (1) Scanner headless de cookies/pixels, (2) IA cruza política de privacidade × cookies achados, (3) Gerador de Política/Termos/banner, (4) Executor via OAuth + re-scan mensal.

---

## 1. O gancho de medo é verdadeiro? ("sua conta de anúncios pode ser suspensa")

**Veredito: parcialmente falso. É FUD na parte que mais vende.**

### 1.1 Google Ads — o que a política REALMENTE exige

**a) Política de privacidade: sim, é exigida — mas como *disclosure*, não como consentimento.**

A política de anúncios personalizados ([Restricted targeting in Personalized advertising](https://support.google.com/adspolicy/answer/143465)) remete a uma página de requisitos, [What to include in your privacy policy for your data segments](https://support.google.com/google-ads/answer/2549063). O que ela obriga, verbatim:

> "An appropriate description of how you're using your data to advertise online"
> "A message about how third-party vendors, including Google, show your ads on sites across the Internet"
> "A message about how third-party vendors, including Google, use cookies and/or device identifiers to serve ads based on someone's past visits"
> "Information about how your visitors can opt out of Google's use of cookies or device identifiers by visiting Google's Ads Settings"

Ou seja: **quatro parágrafos de texto na política**. Nenhuma exigência de banner, de bloqueio de script ou de opt-in. Um gerador cobre isso; um scanner não é necessário para isso.

**b) Consentimento de cookies: NÃO existe equivalente brasileiro.**

A [EU user consent policy](https://www.google.com/about/company/user-consent-policy/) é explícita quanto ao escopo:

> "end users in the European Economic Area, the UK and Switzerland"

E as obrigações listadas ("consent for the use of cookies or other local storage **where legally required**", retenção de registro de consentimento, instruções de revogação) valem só nesse escopo. **O documento não menciona Brasil nem LGPD em nenhum ponto.** A própria página de personalized advertising fecha com: *"Advertisers are also required to comply with our policies for European Union user consent, **where applicable**."*

**c) Suspensão de conta: acontece, mas por outro motivo.**

O que suspende conta sem aviso é a política de [Misrepresentation](https://support.google.com/adspolicy/answer/6020955), verbatim:

> "If violations of this policy are found, your Google Ads accounts will be suspended upon detection and without prior warning, and you will not be allowed to advertise with Google Ads again."

Isso é para violação "egregious" (fraude, ocultação de identidade, prática enganosa). Já a política de anúncios personalizados diz apenas:

> "If you aren't able to fix these violations or choose not to, remove your ad to help prevent your account from becoming **suspended in the future for repeated policy violations**."

E [Destination requirements](https://support.google.com/adspolicy/answer/6368661) explicita a gradação:

> "Violations of this policy will not lead to immediate account suspension without prior warning. A warning will be issued at least 7 days prior to any suspension of your account."

**Conclusão Google:** falta de política de privacidade adequada é um risco de **reprovação de anúncio / advertência com 7 dias**, não de banimento. Falta de banner de cookies no Brasil **não viola nenhuma política do Google**.

### 1.2 Meta — aqui existe uma obrigação contratual real, e é global

Os [Termos das Ferramentas de Negócios da Meta](https://www.facebook.com/legal/terms/businesstools) são mais duros que o Google na parte de aviso:

**Seção 3.c** (aviso — sem recorte geográfico):
> "You declare and guarantee having provided users an adequate and sufficiently visible notice regarding collection, sharing and use of Business Tools Data, which includes, at minimum: [para websites] an evident and visible notice on each webpage where our pixels are used that leads to a clear explanation of (a) that you may use pixels, web beacons and other third-party storage technologies, including Meta's, to collect or receive information from your websites…"

Isso vale para **qualquer** loja que roda o Pixel, inclusive no Brasil. Uma loja Nuvemshop com Pixel e sem aviso visível em cada página está tecnicamente em violação de 3.c.

**Seção 3.d** (consentimento — com recorte geográfico):
> "In jurisdictions requiring informed consent for storing and accessing cookies or other information on a user's device (such as the European Union, among others), you must ensure, in a verifiable manner, that the end user provides all necessary consents before you use Meta's Business Tools."

O gatilho é *"jurisdictions requiring informed consent"*. O Brasil não tem diretiva ePrivacy; a LGPD admite legítimo interesse para cookies necessários (ver §2.4). Logo 3.d **não é claramente acionada no Brasil** para cookies necessários — e é acionada para publicidade comportamental, mas por força da LGPD, não do contrato.

**Enforcement:** Seção 4.a — *"We may modify, suspend or terminate access to Meta's Business Tools… at any time"* e 4.c — *"We reserve the right to monitor or verify your compliance"*. É um direito contratual amplo, não um processo com métrica pública.

### 1.3 Com que frequência isso acontece de fato no Brasil?

**Não encontrei nenhuma fonte primária** — nem do Google, nem da Meta — documentando onda de suspensão de contas brasileiras por ausência de banner de cookies ou política de privacidade. Não há comunicado, changelog de política, nem página de enforcement regional apontando isso. A ausência de fonte primária, num tema em que ambas as plataformas publicam changelogs detalhados, é evidência razoável de que **o gancho "sua conta vai ser suspensa" é retórica de vendedor**.

**O que é honesto dizer ao lojista:** (a) o Google exige 4 parágrafos na sua política se você usa remarketing; (b) a Meta exige um aviso visível em toda página onde o Pixel roda; (c) descumprir é violação contratual real, mas o desfecho documentado é reprovação de anúncio e advertência, não banimento.

---

## 2. A ANPD está mesmo multando?

**Veredito: sim, mas em volume irrisório e nunca por cookie/banner de e-commerce.**

### 2.1 Teto legal (fonte: Planalto)

[Lei 13.709/2018, Art. 52](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), verbatim:

> "II - multa simples, de até 2% (dois por cento) do faturamento da pessoa jurídica de direito privado, grupo ou conglomerado no Brasil no seu último exercício, excluídos os tributos, **limitada, no total, a R$ 50.000.000,00 (cinquenta milhões de reais) por infração**"

O inciso I prevê **advertência com prazo para medidas corretivas** — e o §1º manda aplicar as sanções "de forma gradativa", considerando "a condição econômica do infrator" e "a cooperação do infrator".

**Cálculo para o público-alvo:** loja de R$50k/mês = R$600k/ano. Teto de multa por infração = **2% × R$600k = R$12.000**. E a sanção é gradativa, começando por advertência. O "risco de R$50 milhões" que aparece em material de marketing é matematicamente impossível para esse cliente.

### 2.2 Sanções efetivamente aplicadas

⚠️ **Limitação metodológica:** a página oficial [Processos Administrativos Sancionadores](https://www.gov.br/anpd/pt-br/composicao-1/coordenacao-geral-de-fiscalizacao/processos-administrativos-sancionadores) e a notícia da primeira multa retornam **"Conteúdo Restrito — É necessário autenticar"** (HTTP 401) para acesso público. A página [Sanções Administrativas](https://www.gov.br/anpd/pt-br/acesso-a-informacao/sancoes-administrativas) não lista casos: apenas remete ao Portal da Transparência (CEIS/CNEP). **Não é possível montar a lista completa por fonte primária aberta.** O que segue vem de comunicados da própria ANPD que continuam acessíveis, mais notícia de veículos, marcado como tal.

| Caso | Data | Sanção | Valor | Fonte |
|---|---|---|---|---|
| **Telekall Infoservice** (microempresa de telemarketing) | jul/2023 | Advertência (falta de encarregado) + multa (falta de base legal) + multa (não responder à ANPD) | **R$ 14.400** (2 × R$7.200) | Comunicado ANPD (página hoje 401); amplamente reportado |
| **ByteDance / TikTok** | 25/08/2026 | Multa por tratamento de dados de crianças e adolescentes sem hipótese legal — 5 violações aos arts. 6º VIII e X e 7º | **R$ 153,7 milhões** | [ANPD — comunicado oficial](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-multa-tiktok-em-r-153-7-milhoes-por-falhas-na-protecao-de-dados-de-criancas-e-adolescentes) |
| Órgãos públicos diversos (saúde, educação, previdência) | 2023–2026 | Majoritariamente advertências | — | [Monitoramento de encarregados — 56 agentes, 21 sem resposta](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-conclui-monitoramento-encarregados-avalia-sancao-empresas-e-orgaos-publicos) |

Fontes secundárias (agregadores jurídicos, **não verificáveis em primária por causa do 401**) convergem em: **~9 organizações sancionadas até 2026, das quais apenas 1 empresa privada** (a Telekall) e o restante órgãos públicos; a infração mais recorrente sendo **falha em comunicar incidente (art. 48)**, não cookies.

### 2.3 O caso Telekall é o contraexemplo importante — e ele *não* ajuda o pitch

Foi uma **microempresa**, sim. Mas os fatos: vendia listas de WhatsApp de eleitores para campanha eleitoral em Ubatuba/SP, e **não respondeu às intimações da ANPD** (metade da multa foi exatamente por isso). Fundamento: falta de base legal e falta de encarregado. **Nada a ver com banner de cookies, política de privacidade desatualizada ou pixel de terceiro.**

### 2.4 O que a ANPD de fato diz sobre cookies

O [Guia Orientativo "Cookies e Proteção de Dados Pessoais"](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf) (out/2022) é **soft law** — orientativo, não regulamento sancionável. Trechos verbatim relevantes:

Sobre legítimo interesse:
> "De forma geral, o legítimo interesse poderá ser a hipótese legal apropriada nos casos de utilização de cookies estritamente necessários, isto é, aqueles que são essenciais para a adequada prestação do serviço ou para o funcionamento da página eletrônica"

Sobre publicidade e terceiros — **este é o trecho que sustenta o produto**:
> "é possível afirmar que o legítimo interesse dificilmente será a hipótese legal mais apropriada nas hipóteses em que os dados coletados por meio de cookies são utilizados para fins de publicidade. É o que se verifica, em especial, se a coleta é efetuada por meio de cookies de terceiros e quando associada a práticas que podem implicar maior risco à privacidade… como as de formação de perfis comportamentais… Em tais contextos, o teste de balanceamento previsto na LGPD conduzirá, em geral, à conclusão de que devem prevalecer direitos e liberdades fundamentais dos titulares"

Sobre o desenho do banner (exemplo de boa prática, verbatim):
> "o banner passou a contar com três opções, todas com o mesmo formato e destaque: 'aceitar todos os cookies'; 'rejeitar todos os cookies'; e 'gerenciar cookies'… **Os cookies baseados no consentimento estão desativados por padrão**, com a possibilidade de o usuário marcar as opções que entender adequadas"

E o que faltava para conformidade plena naquele exemplo: *"mecanismo simplificado e gratuito para a revogação do consentimento, a qualquer momento"*.

**Portanto:** a tese técnica do produto (bloquear pixel de Meta/Google antes do aceite, botão "rejeitar todos" com mesmo destaque, revogação fácil) **está alinhada com o que a ANPD escreveu**. O que não existe é a consequência: nenhuma multa por isso.

### 2.5 O vetor que muda no futuro

A [Lei nº 15.352, de 25/02/2026](https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/noticias/2026/02/presidente-lula-sanciona-lei-que-cria-a-agencia-nacional-de-protecao-de-dados) transformou a ANPD em **agência reguladora** com autonomia funcional/financeira e **criou 200 cargos de especialista em regulação, a serem preenchidos por concurso público** ([Senado](https://www12.senado.leg.br/noticias/materias/2026/02/26/sancionada-lei-que-cria-a-agencia-nacional-de-protecao-de-dados)). A capacidade de fiscalização vai crescer. Mas concurso público leva 12–24 meses até gente em campo, e a prioridade declarada é o **ECA Digital** (Lei 15.211/2025, vigência 17/03/2026) — não e-commerce de pequeno porte.

**Resposta direta:** para um lojista de R$50k/mês, a ameaça da ANPD **hoje é remota**. Teto real de R$12k, sanção gradativa começando por advertência, zero precedente no nicho, e a fila de fiscalização apontada para plataformas de menores e órgãos públicos.

---

## 3. As plataformas já resolvem isso nativo?

**Veredito: o módulo 3 (Gerador) está comoditizado. O módulo 1 (Scanner) e o 4 (Executor + monitoramento) não.**

| | Shopify | Nuvemshop | WooCommerce/WP | Wix |
|---|---|---|---|---|
| Banner de cookies nativo grátis | **Sim** | **Não** | Não (core) | **Sim** (Usercentrics) |
| Bloqueia script antes do aceite | Não documentado | — | — | **Sim, declarado** |
| Cobre LGPD explicitamente | Não menciona | Só no gerador | Só via plugin | Não menciona |
| Gerador de política grátis | **Sim** (GDPR/CCPA/PIPEDA) | **Sim** ("adequado à LGPD") | Sim, básico | **Sim** |
| API de consentimento | **Sim** | Não achada | — | Não pública |

**Shopify.** A [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy) (`window.Shopify.customerPrivacy`, `setTrackingConsent()`, `shouldShowGDPRBanner()`) é grátis e embutida. O [banner nativo](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings) também: *"we will automatically configure your cookie banner for visitors in the UK and EEA regions"* — **configuração automática só para UK/EEA; nenhuma menção a LGPD/Brasil na documentação**. O app "Shopify Privacy & Compliance" foi [descontinuado em 01/03/2024](https://changelog.shopify.com/posts/introducing-the-updated-shopify-privacy-and-compliance-app), absorvido pela seção nativa. O [gerador de política](https://www.shopify.com/tools/policy-generator) é grátis e cobre GDPR/CCPA/PIPEDA, **sem LGPD**.

**Nuvemshop.** Não tem banner nativo nem API de consentimento documentada. Mas **tem [Gerador de Política de Privacidade](https://www.nuvemshop.com.br/ferramentas/gerador-politica-de-privacidade) gratuito e sem limite de uso, descrito como adequado à LGPD** — isso mata sozinho o argumento de venda do módulo 3 para o principal público-alvo brasileiro.

**WooCommerce/WordPress.** O core tem, desde 4.9.6 (2018), página de política + Privacy Policy Guide + [ferramentas nativas de exportação e apagamento de dados pessoais](https://developer.wordpress.org/plugins/privacy/privacy-related-options-hooks-and-capabilities/). O WooCommerce tem [Accounts & Privacy](https://woocommerce.com/document/configuring-woocommerce-settings/accounts-and-privacy/). Não há banner nativo — **mas há dois plugins gratuitos com 1M+ instalações ativas cada, ambos citando LGPD explicitamente**: [Complianz](https://wordpress.org/plugins/complianz-gdpr/) (4.7/5) e [CookieYes](https://wordpress.org/plugins/cookie-law-info/) (4.8/5, 3.200+ avaliações), ambos com scanner de cookies, bloqueio de script e gerador de política **na versão grátis**. **O segmento WooCommerce está morto para este produto.**

**Wix.** [Banner Usercentrics nativo](https://support.wix.com/en/article/displaying-a-cookie-banner-on-your-site), verbatim: *"The basic version of the Usercentrics cookie banner is free to use and fully GDPR-compliant"* e carrega *"only essential cookies and scripts"* até o consentimento. **É a única plataforma com bloqueio pré-consentimento documentado como padrão grátis.**

**Sobra espaço?** Sim, mas menor e diferente do imaginado: o que nenhuma plataforma entrega é **auditoria** (o que de fato dispara na *sua* loja, com os *seus* apps instalados) e **monitoramento contínuo** (alerta quando um app novo injeta um pixel). O que todas entregam de graça é o documento.

---

## 4. Concorrência

### 4.1 Globais (preço da página oficial de pricing)

| Ferramenta | Preço | Free? | LGPD? | Gerador? |
|---|---|---|---|---|
| [Cookiebot / Usercentrics](https://www.cookiebot.com/en/pricing/) | €0 → €7 / €15 / €30 / €50 / €90 por domínio | Sim (1 domínio, 50 subpáginas) | **Sim, na própria pricing**: "GDPR, CCPA/CPRA, VCDPA, **LGPD**, POPIA" | Sim |
| [Iubenda](https://www.iubenda.com/en/pricing) | €4,99 / €19,99 / €79,99 mês (anual) | Sim (básico) | Sim, página dedicada "Brazil's LGPD" | Sim |
| [Termly](https://termly.io/pricing/) | $0 / $10 / $15 por site | Sim (10k views/mês) | Genérico ("28 leis") | Sim |
| [CookieYes](https://www.cookieyes.com/pricing/) | $0 / $10 / $25 / $55 | Sim (5k pageviews) | Página dedicada LGPD | Sim |
| [Osano](https://www.osano.com/plans/cookie-consent) | $0 / $199 mês | Sim (5k visitantes) | Cita LGPD | Parcial |
| [Complianz](https://complianz.io/pricing) | $59 / $179 / $399 por ano | Sim (plugin WP) | Página `/brazil/` | Não dinâmico |
| [Secure Privacy](https://secureprivacy.ai/pricing) | $0 / $15 / $59 / $249 | Sim (10 domínios) | Sim (KB) | Sim |

**Todos os 7 citam LGPD.** Nenhum tem LGPD como proposta central — é item de checklist. **E todos têm plano gratuito.**

### 4.2 Brasil

Correção importante sobre a lista original: **Adapta** (`adapta.org`) é plataforma de IA/automação, não privacidade; **Gauss** (`gauss.com.br`) é autopeças; **"Opt-out"** e **"LGPD na Prática"** não correspondem a SaaS identificáveis (o segundo é nome genérico de cursos). Os players reais:

| Empresa | Preço | Perfil | Integração e-commerce |
|---|---|---|---|
| [Privacy Tools](https://privacytools.com.br) | Sob consulta (OLX, Americanas, Eletrobras) | Enterprise | Não |
| **[CookieFácil](https://cookiefacil.com.br)** | **R$0 / R$24,99 / R$49 / R$149 / R$349 mês** | **PME/e-commerce** | **Shopify, Nuvemshop, WooCommerce, WordPress** |
| [DPOnet](https://dponet.com.br) | Sob consulta | PME + DPO-as-a-service | Genérica |
| [AdOpt](https://goadopt.io) | Sob consulta (trial 30d) | Enterprise/agências | Não |
| OneTrust Brasil | Sob consulta | Enterprise | Não |

**CookieFácil é o concorrente direto que importa:** brasileiro, preço público em BRL, plano grátis, e cobre exatamente as 4 plataformas-alvo — a R$49/mês, metade do ticket proposto.

### 4.3 Shopify App Store — saturada

| App | Preço | Reviews | Nota | LGPD? |
|---|---|---|---|---|
| [Pandectes GDPR Compliance](https://apps.shopify.com/pandectes-gdpr-compliance) | Free / $9 / $29 / $49 | **2.902** | 5,0 | Sim, PT-BR |
| [Consentmo GDPR Compliance](https://apps.shopify.com/consentmo) | Free / $10 / $37 / $64 | **1.896** | 5,0 | Sim, PT-BR |
| [Avada GDPR Cookies Consent](https://apps.shopify.com/eu-cookie-bar) | Free / $9,95 / $23,95 / $34 | 847 | 5,0 | Sim |
| [Consentik](https://apps.shopify.com/consentik) | Free / $7,99–$39,99 | 267 | 4,9 | Sim, PT-BR |
| [Complianz Consent](https://apps.shopify.com/complianz-gdpr-cookie-consent) | Free / $5,99 | 265 | 4,4 | Sim, PT-BR |
| [CookiePal: GDPR, LGPD & CCPA](https://apps.shopify.com/cookiepal) | Free / $5 / $10 | 1 | 5,0 | **LGPD no nome** |
| **LGPDY** (único LGPD-first) | — | — | — | **Descontinuado, fora da loja** |

Leitura: os líderes têm ~2.900 e ~1.900 reviews, todos com **plano gratuito** e todos já listando LGPD com interface em português. O único app LGPD-first morreu. **Isso é sinal ambíguo: ou o nicho não sustenta um app dedicado, ou o produto era ruim — mas não é sinal de vácuo.**

### 4.4 Nuvemshop App Store — deserto

Apenas **2 apps** relevantes, ambos do mesmo desenvolvedor (Abejita):

| App | Preço | Avaliações |
|---|---|---|
| [Barra de Cookies GDPR](https://www.nuvemshop.com.br/loja-aplicativos-nuvem/gdpr-cookie-consent) | Pré-pago (US$0 base, até US$6,50/uso) | 7 · 5,0 |
| [Termos e Condições](https://www.nuvemshop.com.br/loja-aplicativos-nuvem/abejita-terms-conditions-box) | Grátis | 1 · 5,0 |

**8 avaliações no total, na maior plataforma de e-commerce do Brasil.** Duas leituras opostas e ambas plausíveis: (a) vácuo competitivo real; (b) demanda insuficiente para atrair sequer um segundo desenvolvedor em 6 anos de LGPD. A segunda leitura merece peso — se houvesse dinheiro fácil ali, o Pandectes (2.902 reviews na Shopify) já teria portado.

### 4.5 Entrante tem espaço?

**Sim, mas estreito e não onde o pitch aponta.** Espaço real: (i) Nuvemshop, onde não há concorrente sério; (ii) o **scanner + relatório em português claro**, que nenhum dos incumbentes faz como produto (Complianz e CookieYes têm scanner, mas o output é técnico, não um "relatório de risco" legível para leigo). Espaço inexistente: gerador de documento (grátis em toda parte) e banner puro (grátis em toda parte, com free tier dos 7 globais + free tier dos 5 apps líderes da Shopify).

---

## 5. Custo de distribuição via app store

### Shopify

- **Processo:** Draft → Submitted → Paused/Reviewed → Published ([review process](https://shopify.dev/docs/apps/launch/app-store-review/review-process)). **Nenhum SLA de prazo publicado na doc oficial.**
- **Revenue share** ([oficial](https://shopify.dev/docs/apps/launch/distribution/revenue-share), vigente desde 01/01/2025): **0% sobre o primeiro US$1M de receita bruta acumulada vitalícia**, depois **15%**. Mudou de "isenção anual" para "vitalícia" em 2025 ([changelog](https://shopify.dev/changelog/update-to-shopifys-app-developer-revenue-share)). Taxa única de US$19 para a conta Partner. Processamento de pagamento 2,9%.
- **Protected Customer Data** ([doc](https://shopify.dev/docs/apps/launch/protected-customer-data)) — **atenção, isso é obrigação direta para o produto proposto:** Nível 1 obrigatório para qualquer app que toque dados protegidos; **Nível 2 obrigatório se usar campos de identificação direta** (nome, e-mail, telefone), exigindo criptografia de backups e separação de ambientes. Um app que só lê configuração de tema e injeta script pode se manter no Nível 1 — vale desenhar o escopo de OAuth para isso.
- **Built for Shopify:** opcional, mas exige não degradar velocidade da loja em mais de 10 pontos — relevante para um app que injeta banner.

### Nuvemshop

- **Processo:** homologação por **checklist + vídeo-demonstração** gravado pelo parceiro ([overview](https://dev.nuvemshop.com.br/en/docs/homologation/overview), [requirements](https://dev.nuvemshop.com.br/en/docs/homologation/requirements)). Exige diagrama de sequência da interação com a API e conta demo. **A partir de 05/06/2026, novos apps devem usar NubeSDK.** Se o parceiro não responder em 5 dias, o app sai da fila.
- **Revenue share:** ⚠️ **não divulgado publicamente**. A [doc oficial de billing](https://atendimento.nuvemshop.com.br/pt_BR/parceiros-tecnologicos/como-eu-recebo-pelo-uso-do-meu-aplicativo-criado-na-nuvemshop) descreve dois modelos — cobrança própria do parceiro (Nuvemshop não participa) ou cobrança pela Nuvemshop com repasse já descontado de taxa de meio de pagamento e imposto — mas **não publica percentual**; casos específicos são "acordo com o gerente comercial". Isso é um risco de modelagem financeira que só se resolve conversando com eles.

### WordPress.org

- **Guideline 5** proíbe trialware (funcionalidade travada por pagamento no código do plugin). **Guideline 6** permite plugin como front-end de SaaS pago **desde que o serviço externo seja realmente funcional**, não uma casca para validar licença. Freemium é permitido; wrapper vazio não. **Guideline 11** permite upsell no admin desde que dispensável e contextual. ([Detailed Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/))
- **Fila:** dado operacional do próprio time — em 24/08/2026 havia **5.127 plugins na fila, 4.223 esperando há mais de 7 dias**, com ~700 submissões/semana ([Plugins Team update](https://make.wordpress.org/updates/2026/08/24/plugins-team-24-aug-2026/)).

### É canal orgânico real ou deserto?

- **Shopify: canal real, mas competitivo.** Existe busca interna, categoria "Privacy - GDPR" e ranking por reviews. Entrar significa competir com apps de 2.900 reviews que têm plano grátis. Aquisição orgânica existe, mas o custo é acumular reviews contra incumbentes de 5 anos.
- **Nuvemshop: quase deserto — literalmente 2 apps na categoria.** Ranquear ali é trivial. O problema não é competição, é volume de busca.
- **WordPress.org: canal enorme mas irrelevante aqui** — os dois plugins líderes já têm 1M+ instalações ativas cada, grátis, com scanner e LGPD.

---

## 6. Risco jurídico de gerar documento jurídico

### 6.1 A lei

[Lei 8.906/94, Art. 1º](https://www.planalto.gov.br/ccivil_03/leis/l8906.htm), verbatim:

> "São atividades privativas de advocacia:
> I - a postulação a qualquer órgão do Poder Judiciário e aos juizados especiais; (Vide ADIN 1.127-8)
> **II - as atividades de consultoria, assessoria e direção jurídicas.**"

Na **ADI 1.127-8** o STF declarou inconstitucional a expressão "qualquer" no inciso I ([STF](https://portal.stf.jus.br/processos/detalhe.asp?incidente=1597992)) — o inciso II sobreviveu. Portanto **"consultoria e assessoria jurídicas" continuam privativas de advogado inscrito na OAB**.

### 6.2 Onde está a fronteira — e o produto a atravessa em um módulo, não em quatro

A distinção operacional que a jurisprudência usa é **produto padronizado vs. aconselhamento sobre caso concreto**. Os precedentes de condenação envolvem captação de clientela e atuação em caso concreto, não venda de template:

- **TRF-3, 4ª Turma:** empresa de Bauru/SP condenada a **R$50 mil de dano moral coletivo** por exercício ilegal — mas os fatos eram: apresentava-se como elaboradora de cálculos previdenciários e **captava clientes para processos contra o INSS**, com cláusulas contratuais impedindo o cliente de contratar outro profissional. Fundamento: arts. 1º, 15 e 16 do Estatuto ([OAB](https://www.oab.org.br/noticia/64481/oab-obtem-condenacao-de-empresa-por-exercicio-ilegal-da-advocacia)).
- O [Provimento 205/2021 do CFOAB](https://www.oab.org.br/leisnormas/legislacao/provimentos/205-2021) regula publicidade da advocacia e trata de tecnologia: chatbots são permitidos "para o fim de facilitar a comunicação", mas **apps de consulta jurídica são vedados quando usados indiscriminadamente para responder automaticamente a consultas de não-clientes**. Note: o provimento vincula **advogados**, não empresas de software.

**A evidência mais forte de que o módulo 3 é seguro:** a própria [Nuvemshop](https://www.nuvemshop.com.br/ferramentas/gerador-politica-de-privacidade) e a própria [Shopify](https://www.shopify.com/tools/policy-generator) operam geradores de política de privacidade gratuitos no Brasil há anos, sem nenhuma ação da OAB registrada. Idem Iubenda e Termly.

**O módulo com risco real é o 2, não o 3.** Um "relatório de risco" produzido por IA que lê a política *daquele cliente*, cruza com os cookies *daquela loja* e conclui "você está em desconformidade com o art. X" é **opinião jurídica sobre caso concreto** — muito mais próximo de "consultoria e assessoria jurídicas" (Art. 1º II) do que um template preenchido. Essa é a exposição a mitigar.

### 6.3 Como Iubenda e Termly se protegem

Linguagem literal dos [Termos da Iubenda](https://www.iubenda.com/app/en/user/tos/legal):

> "The Service offered by iubenda cannot be regarded as, nor does it substitute any legal advice given by a professional or expert."
> "Documents are generated in a **fully automated manner** and therefore do not constitute or substitute the rendering of legal advice, nor does any assistance and customer support provided by iubenda establish an **attorney-client relationship**."
> "under no circumstance will iubenda's staff or any counsel assist Users in making the correct choice or in drafting the correct custom clauses"

Três mecanismos combinados: (a) negativa expressa de aconselhamento jurídico; (b) ênfase em **automação total** — ninguém analisou o seu caso; (c) negativa de relação advogado-cliente + cap de responsabilidade "to the fullest extent permitted by law". Iubenda também nota que *"Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages"* — ou seja, o cap não é blindagem absoluta.

### 6.4 Exposição se o cliente for multado

- **Contratual:** mitigável por cap de responsabilidade (padrão: limitado ao valor pago nos últimos 12 meses). No Brasil, entre empresas (B2B), cláusula limitativa é geralmente válida — **mas o lojista PJ pequeno pode ser enquadrado como consumidor final do software** (CDC, art. 2º, teoria finalista mitigada aceita pelo STJ), e o [CDC art. 51, I](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) considera nula cláusula que impossibilite ou atenue responsabilidade do fornecedor. **O cap pode não segurar.**
- **Regulatória:** a LGPD atribui responsabilidade ao **controlador** (o lojista), não ao fornecedor do template. O SaaS não é controlador dos dados dos clientes finais da loja.
- **Prática:** dado o teto real de multa para esse público (R$12k para loja de R$50k/mês) e a inexistência de precedente, a exposição financeira esperada é baixa. O risco maior é reputacional/comercial, não jurídico.

**Mitigação mínima recomendada:** copiar a arquitetura da Iubenda (automação total declarada + negativa de relação advogado-cliente + cap), e **reescrever o módulo 2 de "parecer" para "checklist factual"** — em vez de "você está em desconformidade com o art. 7º", dizer "encontramos 14 cookies de terceiros; sua política de privacidade menciona 3; a ANPD recomenda que a política liste os cookies em uso". Fato + citação da fonte oficial, sem conclusão jurídica. Isso reduz muito a exposição sem perder valor percebido.

---

## 7. Arquitetura e custo por scan

**Veredito: custo é irrelevante. Não é restrição de negócio.**

### Vercel serve?

Tecnicamente sim, mas apertado. Limite de bundle: **250 MB descomprimido** ([Functions Limitations](https://vercel.com/docs/functions/limitations)) — **Playwright completo não cabe**. A própria Vercel documenta a solução: [Deploying Puppeteer with Next.js on Vercel](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel), com `puppeteer-core` + `@sparticuz/chromium-min`. Duração com Fluid Compute: 300s no Hobby, até 800s GA no Pro ([duration](https://vercel.com/docs/functions/configuring-functions/duration)) — um scan de 60s cabe folgado. Custo de compute próprio ≈ **$0,0014/scan**.

Para produção com paralelismo, **Cloud Run** (container completo, sem limite artificial de bundle) é a escolha mais estável.

### Browsers gerenciados — custo por 1.000 scans de 60s

| Fornecedor | Modelo | 1.000 scans |
|---|---|---|
| [Steel.dev](https://steel.dev/pricing) | $0,08–0,10/browser-hora | **$1,33–1,67** |
| [Browserbase](https://www.browserbase.com/pricing) | $0,10–0,12/hora (Dev $20/mês, 100h) | **$1,67–2,00** |
| [Browserless](https://www.browserless.io/pricing) | Unit = 30s; Starter $140/mês = 20k units | **$4,00** (overage) |
| [ScrapingBee](https://www.scrapingbee.com/pricing/) | 5 créditos/request com JS | $0,50 — mas é API de request, **não dá controle de sessão/rede**, inadequado |
| [Bright Data Scraping Browser](https://brightdata.com/products/scraping-browser) | $5–8/GB | ~$19–31 |

### LLM

Estimativa: política de 2.000–4.000 palavras (~4.500 tokens PT-BR) + lista de ~80 cookies (~2.400) + requests (~1.000) + prompt (~800) ≈ **9.000 tokens de input**, ~1.200 de output.

| Modelo | Preço (in/out por MTok) | Custo/análise |
|---|---|---|
| [Gemini 2.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/pricing) | $0,10 / $0,40 | **$0,0014** |
| [GPT-4o-mini](https://developers.openai.com/api/docs/pricing) | $0,15 / $0,60 | $0,0021 |
| [Claude Haiku 4.5](https://platform.claude.com/docs/en/about-claude/pricing) | $1 / $5 | $0,0150 |
| [Claude Sonnet 5](https://platform.claude.com/docs/en/about-claude/pricing) | $2 / $10 | $0,0300 |

### Total (USD/BRL ≈ 5,19)

| Combinação | Total/scan | 1.000 scans |
|---|---|---|
| Barata (Steel + Flash-Lite) | $0,0027 = **R$0,014** | R$14 |
| Equilibrada (Browserbase + Haiku 4.5) | $0,0167 = **R$0,087** | R$87 |
| Premium (Bright Data + Sonnet 5) | $0,055 = **R$0,285** | R$285 |
| Self-host Vercel + GPT-4o-mini | $0,0035 = **R$0,018** | R$18 |

**Plano free é trivialmente viável.** 10.000 lojas com 1 scan/mês custam R$140–870/mês na configuração barata/equilibrada. O scanner pode e deve ser **grátis e público como isca** — o custo marginal é ~2 centavos de real.

---

## 8. Ticket praticado

### O que o lojista já paga pela plataforma

[Nuvemshop](https://www.nuvemshop.com.br/planos-e-precos): R$0 (com 4,69% por venda) · Essencial **R$69** · Impulso **R$164** · Escala **R$449** · Next a partir de R$1.399.
[Shopify Brasil](https://www.shopify.com/br/precos) (cobrado em USD): Basic US$19 (~R$100) · Grow US$52 (~R$270) · Advanced US$399.

### O que ele paga por app na Nuvemshop (preços reais das páginas dos apps)

| App | BRL/mês |
|---|---|
| Appsnube | R$ 34,27 |
| Lily Reviews — Nível 1 | R$ 59 |
| **Lily Reviews — Nível 2** | **R$ 97** |
| Compre Junto Pro | R$ 99,90 |
| Kit de Produtos Funsales START | R$ 99,90 |
| Kit de Produtos Funsales ÉPICO | R$ 199,90 |
| Lily Reviews — Nível 3 | R$ 249 |
| ANYMARKET | a partir de R$ 399 |
| Lily Reviews — Nível 4 | R$ 549 |
| JivoChat, Pinterest | Grátis |

### R$97/mês é caro?

**Em capacidade de pagamento: não.** R$97 é exatamente o Nível 2 do Lily Reviews (app de função única, consolidado) e ~1,4× o plano Essencial da Nuvemshop. Para quem fatura R$50k+/mês é ~0,2% do faturamento. A mediana de apps de nicho fica em R$30–250/mês; R$97 está no meio.

**Em relação ao valor percebido: sim, é caro — e esse é o problema real.** O concorrente brasileiro direto ([CookieFácil](https://cookiefacil.com.br)) cobra R$49 no plano Profissional e tem plano grátis. Os 5 apps líderes da Shopify e os 7 globais **todos têm free tier**. Cookiebot cobra €7/mês (~R$40). O lojista não vai comparar R$97 com o próprio faturamento — vai comparar com "o Pandectes é grátis".

**Conclusão:** R$97 não está fora da realidade do bolso, mas está **fora da âncora de preço da categoria**, que é R$0–50. Para sustentar R$97 é preciso vender algo que os grátis não fazem — e "banner + política" não é isso.

---

## Veredito

**(a) Riscos REAIS de matar a ideia**

1. **A categoria tem âncora de preço em R$0.** Cinco apps na Shopify (Pandectes 2.902 reviews, Consentmo 1.896) e os sete concorrentes globais têm plano gratuito; o brasileiro CookieFácil cobra R$49 e tem free tier; Complianz e CookieYes entregam scanner + bloqueio + gerador **de graça** a 1M+ sites WordPress cada. Cobrar R$97 por banner + política é insustentável.
2. **O módulo 3 (Gerador) está comoditizado, inclusive pelas próprias plataformas.** Nuvemshop e Shopify operam geradores de política gratuitos e ilimitados; a Nuvemshop inclusive descreve o dela como adequado à LGPD. É o módulo de menor defensabilidade e maior risco jurídico — a pior combinação possível.
3. **WooCommerce/WordPress é segmento morto** e Wix quase morto: Complianz e CookieYes cobrem WP de graça com LGPD explícita; Wix entrega banner Usercentrics nativo com bloqueio pré-consentimento *de fábrica*.
4. **O único app LGPD-first da Shopify (LGPDY) foi descontinuado, e a Nuvemshop tem 8 avaliações somadas em toda a categoria.** Isso pode ser vácuo — ou pode ser o mercado dizendo que lojista brasileiro não paga por isso. Antes de construir, essa é a única pergunta que importa e ela **não se responde com pesquisa, só com pré-venda**.
5. **O módulo 2 (IA emite relatório de risco) é a exposição jurídica de verdade**, não o gerador: Art. 1º, II da Lei 8.906/94 mantém "consultoria e assessoria jurídicas" privativas de advogado (inciso II sobreviveu à ADI 1.127-8), e um parecer automatizado sobre o caso concreto do cliente chega perto dessa linha. Agrava: o cap de responsabilidade pode ser anulado pelo CDC art. 51, I se o lojista PJ for tratado como consumidor final.

**(b) Falso medo**

6. **"Sua conta de anúncios vai ser suspensa" é FUD.** A [EU user consent policy](https://www.google.com/about/company/user-consent-policy/) do Google se aplica literalmente a *"end users in the European Economic Area, the UK and Switzerland"* — **não existe equivalente brasileiro** e o documento nunca menciona LGPD. O Google só exige quatro parágrafos de disclosure na política se você usa remarketing, e [Destination requirements](https://support.google.com/adspolicy/answer/6368661) garante *"a warning will be issued at least 7 days prior to any suspension"*. Suspensão sem aviso existe só na política de [Misrepresentation](https://support.google.com/adspolicy/answer/6020955), para fraude. Zero fonte primária de onda de suspensão no Brasil por cookies.
7. **A ANPD não é ameaça crível para esse cliente.** Uma única empresa privada sancionada até hoje (Telekall, R$14.400 — e metade da multa foi por *não responder à ANPD*, não por cookies). O teto do [Art. 52, II](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) é 2% do faturamento: **R$12 mil** para uma loja de R$50k/mês, com sanção gradativa começando por advertência. Nenhum precedente sobre banner de cookies em e-commerce. (A Lei 15.352/2026 criou 200 cargos e vai aumentar capacidade — mas via concurso, e com prioridade declarada no ECA Digital.)
8. **Custo de infraestrutura não é obstáculo.** R$0,02–0,09 por scan completo (headless + LLM). Free tier ilimitado é economicamente trivial — 10.000 scans/mês custam R$14–87.
9. **Risco de exercício ilegal da advocacia pelo *gerador* é baixo.** Shopify, Nuvemshop, Iubenda e Termly operam geradores no Brasil sem ação da OAB. Os precedentes de condenação (TRF-3, R$50k) envolvem captação de clientela e atuação em caso concreto contra o INSS — não venda de template. Basta copiar o disclaimer da Iubenda: *"generated in a fully automated manner… do not constitute or substitute the rendering of legal advice"*.
10. **O desenho técnico do produto está alinhado com a orientação oficial.** O Guia da ANPD diz literalmente que legítimo interesse *"dificilmente será a hipótese legal mais apropriada"* para publicidade com cookies de terceiros e perfilamento, e valida o padrão "aceitar / rejeitar / gerenciar com mesmo destaque" + *"cookies baseados no consentimento estão desativados por padrão"*. A tese está certa; falta a consequência.

**(c) Melhor relação valor/esforço para o v1**

11. **Módulo 1 + 2 (Scanner + diagnóstico), grátis e público, como isca — não como produto pago.** Custa R$0,02 por execução, não exige OAuth, não exige aprovação de app store, e é a única peça que nenhum incumbente entrega como experiência para leigo ("o Pandectes é grátis" não responde a "você tem 14 pixels disparando antes do aceite e sua política menciona 3"). Constrói lista e prova de valor antes de escrever uma linha de integração. **Reescreva o módulo 2 como checklist factual, não como parecer** — remove quase toda a exposição do Art. 1º, II.
12. **Monetize no módulo 4 (Executor + re-scan mensal + alerta de script novo), e comece pela Nuvemshop.** É o único módulo com defensabilidade (OAuth, estado, monitoramento contínuo, custo de troca) e a Nuvemshop é o único canal onde ranquear é trivial — 2 apps, 8 avaliações, sem API de consentimento nativa, sem banner nativo, e a plataforma dominante no público-alvo. Custo de entrada baixo (homologação por vídeo; 0% de rev share até US$1M na Shopify depois, se escalar). **Módulo 3 vira commodity de suporte ao 4, nunca a proposta de valor.**
13. **Ancore o preço em R$39–59, não R$97**, com free tier. R$97 é defensável pelo bolso do lojista (é o Nível 2 do Lily Reviews) mas indefensável contra CookieFácil a R$49 e cinco apps gratuitos na Shopify.

**A ideia não está morta, mas o pitch está.** O gancho de medo é falso, o gerador é grátis em toda parte, o WooCommerce e o Wix estão cobertos, e a Shopify está saturada. O que sobra é real mas estreito: um scanner grátis em português como aquisição, monetizando monitoramento contínuo na Nuvemshop, a R$39–59. Antes de codar qualquer coisa: **venda 10 assinaturas por R$49 com um scan feito à mão.** Se a Nuvemshop tem 8 avaliações na categoria depois de 6 anos de LGPD, a hipótese "ninguém paga por isso" precisa ser falseada primeiro.
