---
status: accepted
---

# Chromium roda na Vercel, sem serviço de navegador externo

O exame precisa de um navegador de verdade, e a escolha convencional seria um serviço gerenciado (Browserless, Browserbase) ou um worker próprio numa VPS. Optamos por rodar Chromium dentro da própria Vercel, via `@sparticuz/chromium` com `playwright-core`, porque as *large functions* passaram a admitir bundle de até 5 GB com fluid compute, o que acomoda o binário com folga, e porque manter uma superfície de infraestrutura só não tem custo operacional recorrente.

## Verificado por spike

Confirmado em deployment real (2026-08-30), não por leitura de documentação:

- Bundle de 452 MB construiu e subiu. *Large functions* vem ativo por padrão em projeto novo — nenhuma variável de ambiente foi necessária.
- Runtime Node v24, região `iad1`, `AWS_LAMBDA_FUNCTION_MEMORY_SIZE` oculta, que é a assinatura de fluid compute.
- Chromium sobe e navega. Exame de loja real devolveu 12 cookies, incluindo `_ga`, `_ga_662ZWPHP67` e `_vwo_uuid`, em cerca de 6 segundos com instância fria.
- `playwright-core` e `puppeteer-core` funcionam. O relato da comunidade sobre fluid compute quebrar Playwright **não se reproduziu**. Ficamos com Playwright, como especificado.

## Consequences

Duas armadilhas de empacotamento, e a segunda é a que custaria semanas se descoberta tarde:

1. Os pacotes precisam estar em `serverExternalPackages` — eles resolvem binário por caminho relativo e quebram se forem empacotados pelo bundler.
2. `serverExternalPackages` **não basta**. O file tracing do Next só segue import de JavaScript, então os arquivos brotli do Chromium e o `browsers.json` do Playwright são silenciosamente deixados de fora, e a função falha em produção com "cannot find module" sem nenhum aviso no build. Eles precisam ser forçados com `outputFileTracingIncludes` chaveado pela rota. A documentação da Vercel sobre `includeFiles` não se aplica a projetos Next.

Cada exame é uma invocação por loja, nunca um lote numa função só, porque quarenta lojas de agência não cabem numa janela de duração. Capturas de tela vão para o Supabase Storage, já que o retorno de função tem teto de 4,5 MB.
