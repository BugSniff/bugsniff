# Chromium roda na Vercel, sem serviço de navegador externo

O exame precisa de um navegador de verdade, e a escolha convencional seria um serviço gerenciado (Browserless, Browserbase) ou um worker próprio numa VPS. Optamos por rodar Chromium dentro da própria Vercel, via `@sparticuz/chromium` com `playwright-core`, porque as *large functions* passaram a admitir bundle de até 5 GB com fluid compute, o que acomoda o binário com folga, e porque manter uma superfície de infraestrutura só não tem custo operacional recorrente.

## Consequences

O pacote precisa ficar marcado como `external` no bundler — ele resolve o binário por caminho relativo e quebra se for empacotado. Cada exame é uma invocação por loja, nunca um lote numa função só, porque quarenta lojas de agência não cabem numa janela de duração. Capturas de tela vão para o Supabase Storage, já que o retorno de função tem teto de 4,5 MB.

Existe relato na comunidade da Vercel de fluid compute quebrando scraping com Playwright, e *large functions* exigem fluid compute. Esta decisão está condicionada a um spike que confirme que Chromium sobe nesse runtime; se falhar, ela é revertida em favor de um worker próprio com fila.
