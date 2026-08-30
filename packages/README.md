# Pacotes

Cada pacote aqui é um **módulo profundo**: muito comportamento atrás de uma
interface pequena. A superfície pública de um pacote são seus **entry points**
— os arquivos na raiz dele. Tudo que está em subpasta é privado.

```
packages/
  <nome>/
    index.ts      ← entry point (público). É por aqui que se importa de fora.
    client.ts     ← outro entry point. Um pacote pode expor VÁRIOS.
    lib/          ← implementação: privada, livre para se importar à vontade.
    tests/        ← testes e fixtures (subpasta, logo privada).
```

Público e privado são decididos por **profundidade**, não por lista: qualquer
subpasta é privada, então criar uma pasta nova nunca exige mexer na config.

## As quatro regras

**Fronteira do entry point.** Código de fora de um pacote — o app ou outro
pacote — importa apenas os arquivos de raiz daquele pacote, nunca nada dentro
das subpastas dele.

**Liberdade interna.** Os arquivos de um mesmo pacote se importam livremente
entre si. A restrição é para quem vem de fora.

**Testes pelos entry points.** Arquivos em `<pacote>/tests/` importam entry
points de qualquer pacote e as próprias fixtures, mas nunca a implementação
interna — nem a do próprio pacote. Teste de integração entre pacotes é bem-vindo;
import profundo não.

**Sem ciclos.** Nenhuma dependência circular.

## Nada de barrel

Como a superfície pública é _todo_ arquivo de raiz, exponha **vários entry points
pequenos** (`index.ts`, `client.ts`, `server.ts`) em vez de funilar tudo por um
`index.ts` gigante que reexporta a subárvore inteira. Adicionar entry point é só
criar um arquivo na raiz do pacote.

## Verificar

```sh
pnpm lint:boundaries   # depcruise app packages
pnpm check             # typecheck + fronteiras + testes (roda no pre-commit)
```

Violação é `error`, não aviso: o commit não entra.

`finding-validator/` serve de referência da forma: entry point fino na raiz,
implementação em `lib/`, testes em `tests/` importando só o entry point.

Regras de camada (quais pacotes podem depender de quais) são outra preocupação e
estão como stub comentado em `.dependency-cruiser.cjs`.
