# bugsniff

Auditoria de conformidade LGPD para loja virtual brasileira. Observa o que a loja
realmente faz com dados do visitante, compara com o que ela declara fazer, e
aponta onde as duas coisas divergem.

## Comandos

| Comando           | O que faz                     |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Sobe o app em desenvolvimento |
| `pnpm build`      | Build de produção             |
| `pnpm typecheck`  | `tsc --noEmit`                |
| `pnpm test`       | Testes com Vitest             |
| `pnpm test:watch` | Vitest em watch               |
| `pnpm lint`       | ESLint                        |

## Verificação automática

Os padrões deste repositório são impostos por ferramenta, não por documento. O
hook de pre-commit (Husky) roda, nesta ordem:

1. `lint-staged` — Prettier nos arquivos em stage
2. `pnpm typecheck` — um erro de tipo bloqueia o commit
3. `pnpm test`

Commit que quebre qualquer um dos três não entra.

## Onde as decisões moram

- `CONTEXT.md` — glossário do domínio. Os termos daqui são os termos do código.
- `docs/adr/` — decisões estruturais e por que foram tomadas.
- `docs/agents/` — onde as issues vivem e como os skills devem ler este repo.
- `docs/research/` — pesquisa de validação de mercado.

Issues em [BugSniff/bugsniff](https://github.com/BugSniff/bugsniff/issues); o
spec do produto é a issue #2.
