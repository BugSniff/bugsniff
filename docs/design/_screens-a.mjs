// Entrada pública e o caminho do exame.
import { artboard, screen, icon } from "./_parts.mjs";

const S = { store: "casadobolo.com.br" };

/* ---------------------------------------------------------------- público */

const publicHead = `    <header class="between" style="padding: 20px 40px; border-bottom: 1px solid var(--border)">
      <div class="row" style="align-items: center; gap: 8px">
        <span class="brand-mark">${icon("scan", 15)}</span>
        <span class="brand-name">bugsniff</span>
      </div>
      <a class="btn ghost" href="#">Entrar</a>
    </header>`;

const shot = ({ url, banner, dim = false }) => `
        <div class="shot">
          <div class="shot-bar">
            <span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span>
            <span class="shot-url mono">${url}</span>
          </div>
          <div class="shot-body">
            <div class="row" style="gap: 8px; align-items: center">
              <div class="block" style="width: 84px; height: 14px"></div>
              <div class="bar" style="flex: 1; max-width: 150px"></div>
              <div class="block" style="width: 54px; height: 14px; margin-left: auto"></div>
            </div>
            <div class="block" style="height: 92px"></div>
            <div class="row" style="gap: 8px">
              <div class="block" style="flex: 1; height: 44px"></div>
              <div class="block" style="flex: 1; height: 44px"></div>
              <div class="block" style="flex: 1; height: 44px"></div>
            </div>
            ${
              banner
                ? `<div class="shot-banner">
              <span class="dim">Usamos cookies para melhorar sua experiência.</span>
              <span class="row" style="gap: 6px; align-items: center">
                <span class="block" style="width: 44px; height: 18px; border-radius: 26px"></span>
                <span class="shot-pill"></span>
              </span>
            </div>`
                : `<div class="bar" style="width: 40%; opacity: ${dim ? 0.5 : 1}"></div>`
            }
          </div>
        </div>`;

export const Landing = artboard({
  body: `  <div class="col" style="width: 100%">
${publicHead}
    <main class="col" style="padding: 72px 40px 0; gap: 56px; align-items: center">
      <div class="col" style="gap: 20px; max-width: 720px; text-align: center; align-items: center">
        <span class="tag outline lg">Auditoria de LGPD para loja virtual</span>
        <h1 style="font-size: 46px; line-height: 1.1; letter-spacing: -0.03em">Veja o que a sua loja grava no navegador de quem visita.</h1>
        <p class="lede sub" style="max-width: 620px; text-wrap: pretty">O exame abre a loja num navegador de verdade, antes e depois do banner de consentimento, e mostra o que disparou em cada momento — ao lado da norma que trata disso.</p>
      </div>

      <div class="card" style="width: 560px; gap: 14px">
        <div class="col" style="gap: 6px">
          <label class="label">Endereço da loja</label>
          <div class="field filled">casadobolo.com.br</div>
        </div>
        <div class="col" style="gap: 6px">
          <label class="label">Seu e-mail</label>
          <div class="field on">marina@agenciacaravela.com.br</div>
        </div>
        <button class="btn lg" style="width: 100%">Examinar</button>
        <p class="sub small" style="text-align: center">Mandamos o resultado por um link no seu e-mail. Sem senha: o link é a sua entrada.</p>
      </div>

      <div class="row" style="gap: 20px; max-width: 1060px; width: 100%">
        <div class="card sm" style="flex: 1; gap: 10px">
          <span style="color: var(--sidebar-primary)">${icon("scan", 20)}</span>
          <h2>Duas leituras da mesma loja</h2>
          <p class="sub">Uma sem tocar em nada, outra depois de aceitar o banner. A diferença entre elas é o que a loja fez sem perguntar.</p>
        </div>
        <div class="card sm" style="flex: 1; gap: 10px">
          <span style="color: var(--sidebar-primary)">${icon("scale", 20)}</span>
          <h2>Fato observado, norma citada</h2>
          <p class="sub">Nunca uma conclusão sobre a sua situação jurídica. O relatório diz o que aconteceu e mostra o trecho da norma que trata daquilo.</p>
        </div>
        <div class="card sm" style="flex: 1; gap: 10px">
          <span style="color: var(--sidebar-primary)">${icon("camera", 20)}</span>
          <h2>Prova em imagem</h2>
          <p class="sub">Cada leitura guarda o print da loja naquele instante — a tela que o visitante via enquanto os cookies já estavam gravados.</p>
        </div>
      </div>

      <div class="col" style="gap: 14px; width: 100%; max-width: 1060px; padding-bottom: 72px">
        <h3>Um resultado, como ele aparece</h3>
        <div class="card flush">
          <div class="card-head">
            <div class="col" style="gap: 4px">
              <span class="card-title mono">casadobolo.com.br</span>
              <span class="card-desc small">31 de agosto, 14h02 · banner aceito</span>
            </div>
            <span class="tag pre">7 rastreadores antes do consentimento</span>
          </div>
          <table>
            <thead><tr><th>Cookie</th><th>Rastreador</th><th>Domínio</th><th>Momento</th></tr></thead>
            <tbody>
              <tr><td class="mono small">_fbp</td><td>Meta Pixel</td><td class="dim mono small">.casadobolo.com.br</td><td><span class="tag pre">antes do consentimento</span></td></tr>
              <tr><td class="mono small">_hjSessionUser_31</td><td>Hotjar</td><td class="dim mono small">.casadobolo.com.br</td><td><span class="tag pre">antes do consentimento</span></td></tr>
              <tr><td class="mono small">_ga_8QK2ZP</td><td>Google Analytics</td><td class="dim mono small">.casadobolo.com.br</td><td><span class="tag pre">antes do consentimento</span></td></tr>
              <tr><td class="mono small">IDE</td><td>Google DoubleClick</td><td class="dim mono small">.doubleclick.net</td><td><span class="tag">depois do consentimento</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>`,
});

const centered = (inner) => `  <div class="col" style="width: 100%">
${publicHead}
    <main class="col" style="flex: 1; align-items: center; justify-content: center; padding: 40px">
${inner}
    </main>
  </div>`;

export const Login = artboard({
  body: centered(`      <div class="card" style="width: 420px; gap: 16px">
        <div class="col" style="gap: 6px">
          <h1 style="font-size: 20px">Entrar no bugsniff</h1>
          <p class="sub">Sem senha. Mandamos um link para o seu e-mail e ele é a sua entrada.</p>
        </div>
        <div class="col" style="gap: 6px">
          <label class="label">E-mail</label>
          <div class="field on">marina@agenciacaravela.com.br</div>
        </div>
        <button class="btn lg" style="width: 100%">Mandar o link</button>
        <p class="sub small">Quem ainda não tem conta entra pelo mesmo campo: o primeiro link cria a organização.</p>
      </div>`),
});

export const LinkEnviado = artboard({
  body: centered(`      <div class="card" style="width: 460px; gap: 16px; align-items: flex-start">
        <span class="brand-mark" style="width: 40px; height: 40px; border-radius: 14px">${icon("mail", 20)}</span>
        <div class="col" style="gap: 8px">
          <h1 style="font-size: 20px">Link enviado</h1>
          <p class="sub">Abra seu e-mail e clique no link para ver o exame. Ele começa a rodar quando você clicar — nada sobe antes disso.</p>
        </div>
        <div class="sep" style="width: 100%"></div>
        <div class="col" style="gap: 4px">
          <span class="small">Enviado para</span>
          <span class="mono small dim">marina@agenciacaravela.com.br</span>
        </div>
        <a class="btn outline" href="#">Examinar outra loja</a>
      </div>`),
});

export const LinkExpirado = artboard({
  body: centered(`      <div class="card" style="width: 460px; gap: 16px; align-items: flex-start">
        <span class="brand-mark" style="width: 40px; height: 40px; border-radius: 14px; background: color-mix(in oklab, var(--destructive) 10%, transparent); color: var(--destructive)">${icon("alert", 20)}</span>
        <div class="col" style="gap: 8px">
          <h1 style="font-size: 20px">Este link não vale mais</h1>
          <p class="sub">Um link de entrada vale por uma hora e por um clique só. Se você já tinha aberto ele antes, ou se pediu outro depois, este aqui deixou de valer.</p>
        </div>
        <div class="col" style="gap: 6px; width: 100%">
          <label class="label">E-mail</label>
          <div class="field filled">marina@agenciacaravela.com.br</div>
        </div>
        <button class="btn" style="width: 100%">Mandar um link novo</button>
      </div>`),
});

/* -------------------------------------------------------------------- app */

export const Painel = (dark = false) =>
  screen({
    dark,
    active: "painel",
    store: S.store,
    crumbs: `<strong>Painel</strong>`,
    actions: `<a class="btn" href="#">${icon("plus")} Novo exame</a>`,
    page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Agência Caravela</h1>
          <p class="sub">38 lojas · 12 exames nos últimos 7 dias</p>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="card sm" style="gap: 6px">
          <h3>Lojas com rastreador antes do consentimento</h3>
          <span class="num" style="font-size: 30px; font-weight: 600; font-family: 'Noto Sans', sans-serif">24</span>
          <p class="sub small">de 38 examinadas</p>
        </div>
        <div class="card sm" style="gap: 6px">
          <h3>Lojas sem banner encontrado</h3>
          <span class="num" style="font-size: 30px; font-weight: 600; font-family: 'Noto Sans', sans-serif">9</span>
          <p class="sub small">confirmadas por print</p>
        </div>
        <div class="card sm" style="gap: 6px">
          <h3>Exames que não aconteceram</h3>
          <span class="num" style="font-size: 30px; font-weight: 600; font-family: 'Noto Sans', sans-serif">5</span>
          <p class="sub small">loja recusou o nosso navegador</p>
        </div>
      </div>

      <div class="card flush">
        <div class="card-head">
          <div class="col" style="gap: 4px">
            <span class="card-title">Exames recentes</span>
            <span class="card-desc small">O que cada loja acionou antes de perguntar qualquer coisa</span>
          </div>
          <a class="btn outline sm" href="#">Ver todos</a>
        </div>
        <table>
          <thead><tr><th>Loja</th><th>Banner</th><th>Antes do consentimento</th><th>Depois</th><th>Quando</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td class="mono small">casadobolo.com.br</td>
              <td><span class="tag outline">aceito</span></td>
              <td><span class="tag pre">7 rastreadores</span></td>
              <td class="dim num">3</td>
              <td class="dim small">há 12 min</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td class="mono small">ateliedaflor.com.br</td>
              <td><span class="tag outline">não encontrado</span></td>
              <td><span class="tag pre">4 rastreadores</span></td>
              <td class="dim">—</td>
              <td class="dim small">há 1 h</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td class="mono small">vinhosdaserra.com.br</td>
              <td><span class="tag outline">não reconhecido</span></td>
              <td><span class="tag pre">11 rastreadores</span></td>
              <td class="dim">—</td>
              <td class="dim small">há 3 h</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td class="mono small">petshopdobairro.com.br</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td class="dim small">há 5 h</td>
              <td style="text-align: right"><span class="tag bad">${icon("alert", 12)} não medido</span></td>
            </tr>
            <tr>
              <td class="mono small">livrariadaesquina.com.br</td>
              <td><span class="tag outline">aceito</span></td>
              <td class="dim">nenhum</td>
              <td class="dim num">6</td>
              <td class="dim small">ontem</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
          </tbody>
        </table>
      </div>`,
  });

export const Exames = screen({
  active: "exames",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> <strong>Exames</strong>`,
  actions: `<a class="btn outline" href="#">${icon("refresh")} Examinar de novo</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Exames</h1>
          <p class="sub">Cada exame é uma leitura desta loja num instante. Nada é recalculado depois: o que está aqui é o que o navegador viu naquele dia.</p>
        </div>
      </div>

      <div class="card flush">
        <table>
          <thead><tr><th>Quando</th><th>Banner</th><th>Cookies antes</th><th>Terceiros antes</th><th>Rastreadores nomeados</th><th>Política</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td>31 ago, 14h02</td>
              <td><span class="tag outline">aceito</span></td>
              <td class="num">33</td>
              <td class="num">34</td>
              <td><span class="tag pre">7</span></td>
              <td><span class="tag outline">encontrada</span></td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td>24 ago, 09h40</td>
              <td><span class="tag outline">aceito</span></td>
              <td class="num">31</td>
              <td class="num">30</td>
              <td><span class="tag pre">7</span></td>
              <td><span class="tag outline">encontrada</span></td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td>17 ago, 09h38</td>
              <td><span class="tag outline">não reconhecido</span></td>
              <td class="num">29</td>
              <td class="num">28</td>
              <td><span class="tag pre">6</span></td>
              <td><span class="tag outline">encontrada</span></td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td>
            </tr>
            <tr>
              <td>10 ago, 09h41</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td class="dim">—</td>
              <td style="text-align: right"><span class="tag bad">não medido</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="sub small">Um exame guarda os prints por 7 dias. Depois disso a leitura continua, a imagem não.</p>`,
});

export const ExameEsperando = screen({
  active: "exames",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> Exames <span>/</span> <strong>31 ago, 14h02</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">casadobolo.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag"><span style="width: 6px; height: 6px; border-radius: 999px; background: var(--sidebar-primary)"></span> lendo</span>
            <span class="sub small">começou há 6 segundos</span>
          </div>
        </div>
      </div>

      <div class="card sm" style="gap: 10px; background: color-mix(in oklab, var(--primary) 12%, var(--card))">
        <div class="row" style="gap: 10px; align-items: flex-start">
          <span style="color: var(--sidebar-primary); margin-top: 2px">${icon("scan", 18)}</span>
          <div class="col" style="gap: 4px">
            <span style="font-weight: 500">Esta é a loja antes de qualquer interação.</span>
            <span class="sub">Agora respondendo ao banner, para ver o que muda depois do consentimento. Esta página se atualiza sozinha — pode fechar e voltar depois.</span>
          </div>
        </div>
        <div class="col" style="gap: 10px; padding-top: 4px">
          <span class="row small" style="gap: 10px; align-items: center; color: var(--muted-foreground)">${icon("check", 15)} Fila</span>
          <span class="row small" style="gap: 10px; align-items: center; font-weight: 500"><span style="width: 8px; height: 8px; margin: 0 3px; border-radius: 999px; background: var(--sidebar-primary)"></span> Antes do consentimento</span>
          <span class="row small" style="gap: 10px; align-items: center; color: color-mix(in oklab, var(--muted-foreground) 70%, transparent)"><span style="width: 6px; height: 6px; margin: 0 4px; border-radius: 999px; border: 1px solid currentColor"></span> Depois do consentimento, e a política</span>
        </div>
        <p class="sub small" style="max-width: 520px">Costuma levar de 30 segundos a um minuto. Loja pesada pode passar de dois minutos, e o exame para sozinho em três.</p>
      </div>

      <div class="card flush">
        <div class="card-head">
          <span class="card-title">33 cookies gravados até aqui</span>
          <span class="tag outline">leitura em andamento</span>
        </div>
        <table>
          <thead><tr><th>Cookie</th><th>Rastreador</th><th>Domínio</th><th>Duração</th><th>Momento</th></tr></thead>
          <tbody>
            <tr><td class="mono small">_fbp</td><td>Meta Pixel</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><div class="bar" style="width: 92px; height: 14px; border-radius: 26px"></div></td></tr>
            <tr><td class="mono small">_hjSessionUser_31</td><td>Hotjar</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><div class="bar" style="width: 92px; height: 14px; border-radius: 26px"></div></td></tr>
            <tr><td class="mono small">_ga_8QK2ZP</td><td>Google Analytics</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><div class="bar" style="width: 92px; height: 14px; border-radius: 26px"></div></td></tr>
            <tr><td class="mono small">session</td><td class="dim">não identificado</td><td class="dim mono small">casadobolo.com.br</td><td class="dim">até fechar o navegador</td><td><div class="bar" style="width: 92px; height: 14px; border-radius: 26px"></div></td></tr>
          </tbody>
        </table>
      </div>`,
});

export const Exame = (dark = false) =>
  screen({
    dark,
    active: "exames",
    store: S.store,
    crumbs: `casadobolo.com.br <span>/</span> Exames <span>/</span> <strong>31 ago, 14h02</strong>`,
    actions: `<a class="btn outline sm" href="#">${icon("refresh", 14)} Examinar de novo</a><a class="btn sm" href="#">${icon("report", 14)} Gerar relatório</a>`,
    page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">casadobolo.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag outline">banner aceito</span>
            <span class="sub small">31 de agosto de 2026, 14h02 · lido de São Paulo, em português</span>
          </div>
        </div>
      </div>

      <div class="card" style="gap: 12px; background: color-mix(in oklab, var(--primary) 12%, var(--card))">
        <p class="lede" style="text-wrap: pretty">Antes de qualquer interação com o banner, esta loja acionou <strong>Meta Pixel, Hotjar, Google Analytics, Google Ads, Criteo, TikTok e Google DoubleClick</strong>, e mais 21 outros terceiros que não sabemos nomear.</p>
        <p class="sub">Depois do aceite, mais 3 rastreadores entraram. A leitura completa está abaixo.</p>
      </div>

      <div class="card flush">
        <div class="card-head">
          <div class="col" style="gap: 4px">
            <span class="card-title">Cookies</span>
            <span class="card-desc small">33 antes do consentimento, 9 depois de aceitar o banner</span>
          </div>
          <a class="btn outline sm" href="#">Ver os 42</a>
        </div>
        <table>
          <thead><tr><th>Cookie</th><th>Rastreador</th><th>Domínio</th><th>Duração</th><th>Momento</th></tr></thead>
          <tbody>
            <tr><td class="mono small">_fbp</td><td>Meta Pixel</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">_hjSessionUser_31</td><td>Hotjar</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">_ga_8QK2ZP</td><td>Google Analytics</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">_gcl_au</td><td>Google Ads</td><td class="dim mono small">.casadobolo.com.br</td><td class="dim">persistente</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">session</td><td class="dim">não identificado</td><td class="dim mono small">casadobolo.com.br</td><td class="dim">até fechar o navegador</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">IDE</td><td>Google DoubleClick</td><td class="dim mono small">.doubleclick.net</td><td class="dim">persistente</td><td><span class="tag">depois do consentimento</span></td></tr>
            <tr><td class="mono small">_rdt_uuid</td><td>Reddit</td><td class="dim mono small">.reddit.com</td><td class="dim">persistente</td><td><span class="tag">depois do consentimento</span></td></tr>
          </tbody>
        </table>
      </div>

      <div class="card flush">
        <div class="card-head">
          <div class="col" style="gap: 4px">
            <span class="card-title">Terceiros contactados</span>
            <span class="card-desc small">34 antes do consentimento, 6 depois. Só o endereço — nunca a URL inteira, que carrega identificador de quem visita.</span>
          </div>
        </div>
        <table>
          <thead><tr><th>Endereço</th><th>Rastreador</th><th>Momento</th></tr></thead>
          <tbody>
            <tr><td class="mono small">connect.facebook.net</td><td>Meta Pixel</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">script.hotjar.com</td><td>Hotjar</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">static.criteo.net</td><td>Criteo</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">analytics.tiktok.com</td><td>TikTok</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">track.titanpush.com</td><td class="dim">titanpush.com</td><td><span class="tag pre">antes do consentimento</span></td></tr>
            <tr><td class="mono small">cdn.jsdelivr.net</td><td class="dim">jsdelivr.net</td><td><span class="tag pre">antes do consentimento</span></td></tr>
          </tbody>
        </table>
      </div>

      <div class="card" style="gap: 10px">
        <div class="between">
          <span class="card-title">O que a loja declara</span>
          <span class="tag outline">política encontrada</span>
        </div>
        <p class="sub">Publicada em <a class="mono small" href="#" style="text-decoration: underline">casadobolo.com.br/politica-de-privacidade</a> · 18.286 caracteres, lidos e guardados com este exame.</p>
      </div>

      <div class="col" style="gap: 14px">
        <h2>A loja em cada momento</h2>
        <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
          <div class="col" style="gap: 8px">
            <div class="between">
              <span style="font-weight: 500">Antes de qualquer clique</span>
              <span class="tag pre">33 cookies já gravados</span>
            </div>
${shot({ url: "casadobolo.com.br", banner: true })}
          </div>
          <div class="col" style="gap: 8px">
            <div class="between">
              <span style="font-weight: 500">Depois de aceitar o banner</span>
              <span class="tag">mais 9 cookies</span>
            </div>
${shot({ url: "casadobolo.com.br", banner: false })}
          </div>
        </div>
        <p class="sub small" style="max-width: 760px">A imagem não mostra cookies — cookie é invisível. Ela mostra a tela que o visitante estava olhando enquanto os cookies acima já estavam na máquina dele.</p>
      </div>`,
  });

export const Achados = screen({
  active: "exames",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> Exames <span>/</span> 31 ago <span>/</span> <strong>Achados</strong>`,
  actions: `<a class="btn sm" href="#">${icon("report", 14)} Gerar relatório</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Achados</h1>
          <p class="sub" style="max-width: 720px">Cada achado é um fato observado ao lado da norma que trata dele. Nenhum deles conclui sobre a sua situação jurídica — essa leitura é de quem tem competência para fazê-la.</p>
        </div>
        <span class="tag lg outline">4 achados</span>
      </div>

      <div class="card" style="gap: 14px">
        <div class="between">
          <span class="card-title">Meta Pixel gravado antes de qualquer interação com o banner</span>
          <span class="tag pre">pré-consentimento</span>
        </div>
        <div class="col" style="gap: 6px">
          <h3>Fato observado</h3>
          <p>O cookie <span class="mono small">_fbp</span> (Meta Pixel) foi gravado no navegador antes de qualquer interação com o banner de consentimento, e o endereço <span class="mono small">connect.facebook.net</span> foi contactado no mesmo momento.</p>
        </div>
        <div class="col" style="gap: 6px">
          <h3>Evidência</h3>
          <p class="sub">Estado pré-consentimento do exame de 31 ago, 14h02 — print guardado.</p>
        </div>
        <div class="col" style="gap: 6px">
          <h3>Norma citada</h3>
          <p>Guia Orientativo de Cookies e Proteção de Dados Pessoais — ANPD</p>
          <blockquote style="margin: 0; padding: 12px 16px; border-radius: 12px; background: var(--muted); color: var(--muted-foreground)">“Recomenda-se que os cookies baseados no consentimento estejam desativados por padrão.”</blockquote>
        </div>
      </div>

      <div class="card" style="gap: 14px">
        <div class="between">
          <span class="card-title">Hotjar grava sessão de navegação e não é citado na política</span>
          <span class="tag pre">pré-consentimento</span>
        </div>
        <div class="col" style="gap: 6px">
          <h3>Fato observado</h3>
          <p>O cookie <span class="mono small">_hjSessionUser_31</span> (Hotjar) foi gravado antes do consentimento. A política publicada pela loja, lida neste mesmo exame, não menciona Hotjar nem gravação de sessão.</p>
        </div>
        <div class="col" style="gap: 6px">
          <h3>Norma citada</h3>
          <p>Lei nº 13.709/2018, art. 9º</p>
          <blockquote style="margin: 0; padding: 12px 16px; border-radius: 12px; background: var(--muted); color: var(--muted-foreground)">“O titular tem direito ao acesso facilitado às informações sobre o tratamento de seus dados […] finalidade específica do tratamento.”</blockquote>
        </div>
      </div>

      <div class="card sm" style="gap: 8px; flex-direction: row; align-items: flex-start">
        <span class="dim" style="margin-top: 2px">${icon("shield", 18)}</span>
        <div class="col" style="gap: 4px">
          <span style="font-weight: 500">2 achados foram recusados antes de chegar aqui</span>
          <span class="sub">A validação recusa qualquer texto que conclua em vez de relatar, ou que cite trecho de norma que não confere com a fonte. Recusado não é publicado.</span>
        </div>
        <a class="btn outline sm" href="#" style="margin-left: auto">Ver o que foi recusado</a>
      </div>`,
});
