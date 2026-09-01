# bugsniff

## Agent skills

### Issue tracker

Issues live as GitHub issues in `BugSniff/bugsniff`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Roteiro de conferência

Toda issue termina com um **roteiro de conferência**: os passos que a pessoa
precisa rodar com as próprias mãos. Vai no corpo do PR, onde sobrevive, e na
mensagem que encerra o trabalho, onde é lido na hora.

O roteiro cobre o que a máquina não cobriu. `pnpm check` já roda typecheck,
fronteiras e testes, e `pnpm eval` já roda o modelo — o que sobra para o
roteiro é o que exige uma caixa de entrada, um cartão, um domínio de verdade,
ou o olho de alguém.

Cada passo diz **onde ir, o que fazer e o que deve aparecer**: "abra `/painel`,
a loja nova está na lista com 1 exame" é conferível, "conferir o painel" não é.

Separe o que você **rodou** do que apenas **leu**. Um caminho exercitado de
ponta a ponta e um caminho inspecionado são graus de confiança diferentes, e
quem vai clicar merece saber qual é qual.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Telas e sistema visual

shadcn/ui pelo preset `bkWtWhvox`: estilo base-maia, base mauve, ícones Tabler,
Public Sans no corpo e Noto Sans nos títulos. Tokens em `app/globals.css`,
componentes em `components/ui/`.

**Nenhuma cor significa conformidade** — o âmbar marca ação e o estado
pré-consentimento, o vermelho só erro de sistema e ação destrutiva, e verde não
existe. Ver [ADR-0005](./docs/adr/0005-sistema-visual-e-a-cor-que-nao-conclui.md).

As telas propostas ficam em `docs/design/`, geradas por
`node docs/design/build.mjs`. Os valores das peças saem de `components/ui/*`:
mexeu no componente, mexe em `_parts.mjs`.

### Achados e eval

O achado é redigido por modelo — Groq, `openai/gpt-oss-120b` — que só escreve a
prosa e escolhe o trecho da norma. O fato, a evidência e a citação saem de
código, e nada é gravado nem exibido sem passar pelo validador
([ADR-0001](./docs/adr/0001-ia-fora-do-caminho-da-conclusao.md)).

`pnpm test` não chama modelo nenhum. `pnpm eval` chama, precisa de
`GROQ_API_KEY`, e reprova abaixo do piso de nota — é ele que pega a regressão
de redação que o typecheck não vê.

### Banner de consentimento

O banner gerado é **um arquivo inteiro para colar no tema da loja** — sem script
hospedado por nós, sem telemetria, sem chamada de volta
([ADR-0007](./docs/adr/0007-banner-inteiro-na-loja.md)). O runtime mora como
texto em `packages/consent-banner/lib/runtime.ts`, não como módulo compilado:
ele é entregue sendo lido, pelo lojista ou pelo desenvolvedor dele.

A lista de bloqueio é **derivada** da leitura mais recente contra a tabela
`trackers`, nunca gravada. `trackers.purpose` é o que decide o que pode ser
contido: `essential` nunca é bloqueado, e terceiro que não sabemos nomear nunca
entra na lista — bloquear um chute quebra a loja de alguém.

Os três botões — aceitar, recusar, escolher — saem sempre iguais, e isso não é
configurável.

Quem garante tudo isso é `packages/consent-banner/tests/blocking.test.ts`:
navegador de verdade, loja de teste que dispara rastreador de verdade. Mexeu no
runtime, é esse teste que diz se ainda funciona — o typecheck não vê nada lá
dentro.

### Artefatos visuais

Pedido de artefato, diagrama, página ou mockup vira **arquivo HTML em
`docs/`** — versionado, revisável em PR, e vivo enquanto o repositório viver.
Nunca publicar como artefato hospedado do Claude: o link morre fora do nosso
controle e leva junto toda referência que apontava para ele.

Diagramas em mermaid, com a biblioteca carregada por CDN no próprio arquivo.
Fluxos ficam em `docs/fluxos/`.

### Idioma

Código é inteiramente em inglês: nomes de função, constantes, tipos, comentários
e literais. Documentos (`CONTEXT.md`, ADRs, READMEs, issues, commits) são em
português. Ver a nota de idioma no topo do `CONTEXT.md`.

### Pacotes

Pacotes são módulos profundos: importe apenas pelos entry points (arquivos na
raiz do pacote). Leia [packages/README.md](./packages/README.md) antes de criar
ou importar um.

### AGENTS.md

Gerado e re-adicionado automaticamente pelo `next dev` — não editar à mão. As
convenções deste projeto ficam neste arquivo (`CLAUDE.md`), no `CONTEXT.md` e em
`docs/adr/`.
