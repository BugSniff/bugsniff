# bugsniff

Auditoria de conformidade LGPD para loja virtual brasileira: observa o que a loja realmente faz com dados do visitante, compara com o que ela declara fazer, e aponta onde as duas coisas divergem.

O domínio é brasileiro e jurídico, então os termos canônicos deste glossário são
em português, e os documentos do repositório também (ADRs, READMEs, issues,
commits).

**O código, porém, é inteiramente em inglês** — identificadores, comentários e
literais. O identificador canônico de cada termo aparece entre parênteses abaixo
e é o nome a usar no código. A exceção são dados que _são_ texto em português,
como a lista de linguagem proibida: esses continuam em português porque é o
idioma que o produto escreve.

## Language

### Quem

**Organização** (`Organization`):
A conta que agrupa lojas e membros. Uma agência com quarenta lojas e um lojista com uma loja são a mesma entidade; diferem apenas no número de lojas.
_Avoid_: conta, cliente, tenant, workspace

**Membro** (`Member`):
Pessoa com acesso a uma organização. Pertence a uma organização só — é o que o produto inteiro assume, e o convite respeita: quem chega convidado não ganha organização própria.
_Avoid_: usuário

**Proprietário** (`Owner`):
Membro que responde pela organização, e o único que pode repassar esse papel. Existe exatamente um por organização, garantido por índice. Enquanto houver outra pessoa dentro, ele não pode ser excluído sem repassar antes ([ADR-0009](./docs/adr/0009-o-proprietario-nao-sai-sozinho.md)).
_Avoid_: dono, titular, admin

**Administrador** (`Admin`):
Membro que convida e remove outros membros, e só isso. Não repassa a propriedade nem leva a organização junto ao sair. A linha entre ele e o proprietário: o administrador mexe em quem entra e quem sai, o proprietário mexe em quem manda.
_Avoid_: gerente, moderador, gestor

**Convite** (`Invite`):
Permissão emitida por um proprietário ou administrador para que uma pessoa se torne membro da organização. É o único caminho de entrada numa organização que a pessoa não criou. É entidade própria e não um membro por confirmar: quem foi convidado ainda não tem acesso a nada, e guardá-lo em `members` faria todo controle de acesso do banco depender de um filtro estar certo em toda parte. Vale por prazo e some quando aceito ou revogado.
_Avoid_: solicitação, liberação, acesso

**Lojista**:
Papel de uma organização que administra a própria loja. Não é entidade separada.
_Avoid_: dono, merchant, seller

**Agência**:
Papel de uma organização que administra lojas de terceiros. Não é entidade separada.
_Avoid_: parceiro, revendedor, integrador

**Visitante** (`Visitor`):
Quem navega na loja auditada e tem dados coletados. É o titular na acepção da LGPD e nunca usa o bugsniff.
_Avoid_: usuário final, consumidor, cliente

### O que é auditado

**Loja** (`Store`):
A loja virtual sob auditoria, identificada pela sua URL.
_Avoid_: site, e-commerce, domínio, projeto

**Plataforma** (`Platform`):
O sistema sobre o qual a loja roda: Nuvemshop, Shopify, WooCommerce ou Wix.

**Conexão** (`StoreConnection`):
Autorização que um lojista concede para o bugsniff agir dentro da loja dele.
_Avoid_: integração, instalação, vínculo

### A auditoria

**Exame** (`Scan`):
Uma execução da auditoria sobre uma loja num instante. A auditoria é o produto; o exame é uma execução dela.
_Avoid_: scan, varredura, análise, auditoria, verificação

**Estado pré-consentimento** e **estado pós-consentimento**:
As duas leituras da loja que um exame compara — antes de qualquer interação com o banner, e depois de aceitar.
_Avoid_: antes/depois, primeira/segunda passada

**Rastreador** (`Tracker`):
Cookie ou requisição de terceiro atribuível a um serviço nomeado, como Meta Pixel ou Google Analytics.
_Avoid_: pixel, tag, script, cookie

**Finalidade** (`TrackerPurpose`):
Para que um rastreador está na página, e a única coisa que decide se o banner pode contê-lo: `essential` é o que faz a loja funcionar e nunca é bloqueado, `analytics` mede o visitante, `marketing` é publicidade e perfilamento. Como o nome do rastreador, é um fato sobre o serviço — diz para que ele serve, nunca se ele deveria estar ali.
_Avoid_: categoria, tipo, classe, gravidade

**Achado** (`Finding`):
Um fato observado sobre a loja acompanhado da norma que o endereça. Nunca contém conclusão sobre a situação do lojista.
_Avoid_: problema, erro, alerta, violação, irregularidade, não-conformidade

**Norma** (`Norm`):
Dispositivo legal ou orientação de autoridade citado num achado, sempre acompanhado do trecho de origem.
_Avoid_: lei, regra, requisito, referência

**Monitoramento** (`Monitoring`):
O reexame periódico de uma loja, sem ninguém pedir. Um exame de monitoramento é um exame como qualquer outro — mesma fila, mesma leitura, mesma tabela — e difere apenas em quem o pediu: ninguém.
_Avoid_: agendamento, rotina, verificação contínua, watch

**Aviso** (`Alert`):
A mensagem que sai quando o monitoramento encontra rastreador que a leitura anterior não tinha. Relata a mudança e diz para onde os dados foram; como o achado, não conclui — e, ao contrário dele, não cita norma nenhuma, porque um e-mail automático não é lugar de argumento jurídico.
_Avoid_: alerta de risco, notificação, aviso de não conformidade

### O que é produzido

**Controlador** (`Controller`):
A empresa que responde pelos dados tratados na loja: razão social, CNPJ, endereço, contato e encarregado. É atributo da loja e não da organização — uma agência com quarenta lojas tem quarenta controladores diferentes. Informado uma vez e reaproveitado em todos os documentos daquela loja; campo que ninguém preencheu aparece em branco no texto gerado, nunca preenchido por conta própria.
_Avoid_: empresa, cliente, dados da conta

**Documento** (`Document`):
Política de privacidade ou termos de uso gerados para uma loja.
_Avoid_: contrato, texto, política, arquivo

**Versão de documento** (`DocumentVersion`):
Estado imutável de um documento num instante. É a unidade a que uma revisão jurídica se refere.
_Avoid_: revisão, rascunho, histórico

**Banner de consentimento** (`ConsentBanner`):
O elemento que pede consentimento ao visitante antes de qualquer rastreador disparar.
_Avoid_: cookie banner, pop-up, aviso de cookies, modal

**Lista de bloqueio** (`Blocklist`):
Os rastreadores que o banner impede de disparar enquanto não houver consentimento. Derivada do exame daquela loja, nunca uma lista genérica, e nunca contém o que a loja precisa para funcionar nem o terceiro que não sabemos nomear.
_Avoid_: whitelist, filtro, regras

**Pontuação** (`Score`):
Nota de 0 a 100 atribuída a uma leitura da loja, composta em código a partir do que o exame mediu. Diferente do achado, ela conclui — e por isso existe num lugar só, registrada na [ADR-0006](./docs/adr/0006-pontuacao-de-conformidade.md).
_Avoid_: nota de risco, selo, índice de conformidade, score

**Relatório** (`Report`):
Apresentação dos achados de um exame para leitura humana. Pode sair com a marca da agência.
_Avoid_: laudo, diagnóstico, dossiê

**Revisão jurídica** (`LegalReview`):
Leitura de um advogado externo sobre uma versão de documento, acompanhada das mudanças que ele aponta. Não atesta a conformidade da loja.
_Avoid_: parecer, selo, certificação, atestado, laudo, validação

### Linguagem proibida

O produto relata fatos e cita normas; nunca conclui sobre a situação jurídica de ninguém. As palavras abaixo não aparecem em achado, relatório ou interface, e são rejeitadas por validação automática antes da exibição:

irregular · em desacordo · violação · infração · ilegal · multa · penalidade · sujeito a sanção · não conforme · risco jurídico · você deve · obrigatório

A construção permitida é sempre _fato observado_ mais _norma citada com o trecho de origem_, deixando a conclusão para quem tem competência de concluir.
