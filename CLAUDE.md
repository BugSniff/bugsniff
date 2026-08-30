# bugsniff

## Agent skills

### Issue tracker

Issues live as GitHub issues in `BugSniff/bugsniff`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

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
