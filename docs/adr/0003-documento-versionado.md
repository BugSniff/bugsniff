# Documento tem versão; a revisão jurídica se prende à versão, não à loja

Um advogado externo revisa o documento gerado e aponta as mudanças necessárias. A revisão referencia uma **versão de documento** imutável, nunca a loja: regerar o documento cria versão nova, que não herda nem invalida a revisão anterior.

## Considered Options

O caminho óbvio seria a revisão apontar para a loja, dispensando versionamento. Foi descartado porque o objeto revisado mudaria embaixo do advogado — o cliente edita os dados da empresa na terça e o retorno de segunda passa a se referir a um texto que não existe mais.

## Consequences

Isso decorre de uma decisão maior de produto: o advogado revisa **documento**, não certifica **loja**. Atestado de conformidade de loja apodrece sozinho, porque vale para o estado do site num instante e deixa de valer quando o lojista instala um app novo na semana seguinte. Revisão de documento não tem esse problema, e por isso é o único formato que vendemos.
