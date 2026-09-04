// Entrada pública e o caminho do exame.
import { artboard, screen, icon, waiting } from "./_parts.mjs";

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

/**
 * A espera depois que a primeira leitura chegou.
 *
 * O esqueleto sai de cena aqui: existe leitura de verdade para mostrar, e um
 * esqueleto ao lado do dado de que ele é esqueleto seria fingir esperar por
 * algo que já chegou. Falta só o momento de cada cookie, que só o segundo
 * estado resolve.
 */
export const ExameEsperando = screen({
  active: "exames",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> Exames <span>/</span> <strong>31 ago, 14h02</strong>`,
  page: `${waiting({ at: 1, clock: "1 min 6 s", seconds: 66 })}

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

/* ------------------------------------------- a nota, ponto por ponto */

/**
 * Um ponto da norma como card: a nota dele em cima, o que a leitura achou, e a
 * evidência que sustenta isso.
 *
 * A nota vem primeiro e vem grande porque é o que a pessoa procura na tela. Ela
 * não é colorida pelo valor — o destaque é o tamanho, e nunca a cor, que
 * concluiria o que o texto se recusa a concluir (ADR-0005).
 *
 * `state` são as mesmas três marcas que a nota já tinha: ponto cheio, ponto que
 * faltou, e ponto que esta leitura não conseguiu medir. Só o que faltou ganha
 * âmbar, porque é onde está a ação — e ponto não medido não pode parecer ponto
 * perdido pela loja.
 */
const point = ({
  label,
  earned,
  weight,
  detail,
  norm,
  evidence = "",
  state = "full",
}) => `          <div class="point${state === "full" ? "" : ` ${state}`}">
            <div class="between" style="align-items: flex-start">
              <span class="pts${state === "unmeasured" ? " none" : ""}">${state === "unmeasured" ? "não medido" : `${earned}<em>/${weight}</em>`}</span>
              <span class="point-mark">${icon(state === "full" ? "circle-check" : state === "gap" ? "circle-x" : "circle-dashed", 18)}</span>
            </div>
            <div class="col" style="gap: 4px">
              <span class="point-label">${label}</span>
              <p class="sub small">${detail}</p>
            </div>
${evidence ? `${evidence}\n` : `            <span style="flex: 1"></span>\n`}            <p class="norm">${norm}</p>
          </div>`;

/** A evidência que é um trecho: o que foi citado, e de onde. */
const cited = (caption, text) => `            <figure class="evidence">
              <figcaption>${caption}</figcaption>
              <blockquote>${text}</blockquote>
            </figure>`;

/** A evidência que é uma lista de nomes. */
const names = (rows) => `            <figure class="evidence">
${rows
  .map(
    ([
      caption,
      items,
      kind,
    ]) => `              <figcaption>${caption}</figcaption>
              <div class="chips">${items.map((n) => `<span class="tag${kind ? ` ${kind}` : ""}">${n}</span>`).join("")}</div>`
  )
  .join("\n")}
            </figure>`;

const FAZ = [
  point({
    state: "gap",
    label: "Rastreadores só depois do consentimento",
    earned: 9,
    weight: 30,
    detail:
      "7 de 10 rastreadores nomeados dispararam antes de qualquer interação com o banner.",
    evidence: names([
      [
        "Dispararam antes do consentimento",
        [
          "Meta Pixel",
          "Hotjar",
          "Google Analytics",
          "Google Ads",
          "Criteo",
          "TikTok",
          "Google DoubleClick",
        ],
        "pre",
      ],
      ["Esperaram o aceite", ["Reddit", "Klaviyo", "RD Station"]],
    ]),
    norm: "LGPD, art. 7º, I e art. 8º",
  }),
  point({
    label: "Banner de consentimento",
    earned: 15,
    weight: 15,
    detail:
      "Nosso navegador encontrou o banner desta loja e conseguiu aceitá-lo, o que é o que permitiu ler os dois estados.",
    evidence: cited(
      "Evidência",
      "O print da loja com o banner na tela está guardado com este exame — dá para conferir o que o navegador respondeu."
    ),
    norm: "LGPD, art. 8º",
  }),
];

const DECLARA = [
  point({
    label: "Política de privacidade publicada",
    earned: 10,
    weight: 10,
    detail: "A política foi localizada a partir da loja e lida por inteiro.",
    evidence: `            <figure class="evidence">
              <figcaption>Onde está publicada</figcaption>
              <blockquote>
                <a class="mono" href="#" style="font-size: 12px; text-decoration: underline; color: var(--foreground)">https://casadobolo.com.br/politicas/privacidade</a>
                <span class="col" style="padding-top: 6px">18.286 caracteres lidos e guardados com este exame.</span>
              </blockquote>
            </figure>`,
    norm: "LGPD, art. 9º",
  }),
  point({
    state: "gap",
    label: "A política nomeia o que a loja usa",
    earned: 6,
    weight: 15,
    detail: "A política nomeia 4 dos 10 rastreadores observados.",
    evidence: names([
      [
        "Nomeados na política",
        ["Google Analytics", "Google Ads", "Meta Pixel", "Reddit"],
      ],
      [
        "Observados e não nomeados",
        [
          "Hotjar",
          "Criteo",
          "TikTok",
          "Google DoubleClick",
          "Klaviyo",
          "RD Station",
        ],
        "pre",
      ],
    ]),
    norm: "LGPD, art. 9º, V e art. 6º, VI",
  }),
  point({
    label: "A política diz como revogar o consentimento",
    earned: 7,
    weight: 7,
    detail: "O texto da política cobre este ponto.",
    evidence: cited(
      "Trecho da política",
      "“…O usuário poderá, a qualquer momento, <mark>revogar</mark> o consentimento fornecido, por meio do canal de atendimento indicado nesta política, sem prejuízo da licitude do tratamento realizado até então.”"
    ),
    norm: "LGPD, art. 8º, §5º",
  }),
  point({
    label: "A política identifica o controlador",
    earned: 6,
    weight: 6,
    detail: "O texto da política cobre este ponto.",
    evidence: cited(
      "Trecho da política",
      "“…A Casa do Bolo Comércio de Alimentos Ltda., <mark>inscrita no CNPJ</mark> sob o nº <mark>12.345.678/0001-90</mark>, com sede na Rua das Palmeiras, 220, São Paulo/SP, é a controladora dos dados pessoais tratados nesta loja.”"
    ),
    norm: "LGPD, art. 9º, III",
  }),
  point({
    label: "A política dá um canal de contato",
    earned: 6,
    weight: 6,
    detail: "O texto da política cobre este ponto.",
    evidence: cited(
      "Trecho da política",
      "“…Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados pessoais, entre em contato pelo e-mail <mark>privacidade@casadobolo.com.br</mark>.”"
    ),
    norm: "LGPD, art. 9º, IV",
  }),
  point({
    label: "A política lista os direitos do titular",
    earned: 7,
    weight: 7,
    detail: "O texto da política cobre este ponto.",
    evidence: cited(
      "Trecho da política",
      "“…incompletos ou desatualizados, <mark>anonimização</mark>, bloqueio ou <mark>eliminação dos dados</mark> desnecessários, e <mark>portabilidade</mark> a outro fornecedor, nos termos do <mark>art. 18</mark> da Lei nº 13.709/2018.”"
    ),
    norm: "LGPD, art. 9º, VII e art. 18",
  }),
  point({
    state: "gap",
    label: "A política informa o encarregado",
    earned: 0,
    weight: 4,
    detail: "Não encontramos este ponto no texto da política.",
    evidence: `            <figure class="evidence">
              <figcaption>O que procuramos no texto</figcaption>
              <div class="chips">
                <span class="tag">encarregado</span>
                <span class="tag">DPO</span>
                <span class="tag">data protection officer</span>
              </div>
              <p class="sub small">Nenhum destes aparece nos 18.286 caracteres lidos. Procuramos a palavra, não o cargo nem a intenção: a política pode cobrir o ponto sem usar nenhum destes termos.</p>
            </figure>`,
    norm: "LGPD, art. 41",
  }),
];

/** Uma seção da nota: o título, a soma dela, e os cards. */
const half = (title, lede, earned, weight, cards, columns = 2) =>
  `      <div class="col" style="gap: 14px">
        <div class="between" style="align-items: flex-end">
          <div class="col" style="gap: 3px">
            <h2>${title}</h2>
            <p class="sub small">${lede}</p>
          </div>
          <span class="tally">${earned}<em>/${weight}</em></span>
        </div>
        <div class="points" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr)); --point-h: 304px">
${cards.join("\n")}
        </div>
      </div>`;

/**
 * A tela do exame com a nota em cards, um por ponto da norma.
 *
 * Três coisas mudam em relação à lista. A nota total e a nota de cada ponto
 * passam a ser o maior elemento onde estão, porque é o número que a pessoa
 * procura e é sobre ele que ela vai agir. Cada ponto ganha espaço para uma
 * evidência — o link onde a política está publicada, o trecho que cobre a
 * revogação, os nomes que dispararam antes do banner —, e uma frase sozinha,
 * que era tudo que a lista tinha, não é conferível. E a separação entre o que a
 * loja faz e o que ela declara sai de subtítulo e vira seção com a sua própria
 * soma, porque é a tese do produto: metade da nota é a distância entre as duas.
 *
 * Todos os cards têm a mesma altura. A nota de um ponto não pode parecer maior
 * porque o trecho citado era mais comprido.
 */
export const ExameEmCards = (dark = false) =>
  screen({
    dark,
    active: "exames",
    store: S.store,
    crumbs: `Painel <span>/</span> <strong>casadobolo.com.br</strong>`,
    actions: `<a class="btn outline sm" href="#">${icon("doc", 14)} Documentos</a><a class="btn outline sm" href="#">${icon("shield", 14)} Banner</a><a class="btn sm" href="#">${icon("refresh", 14)} Examinar de novo</a>`,
    page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">casadobolo.com.br</h1>
          <p class="sub" style="max-width: 620px">Cada exame é uma leitura desta loja num instante. Nada é recalculado depois: o que está aqui é o que o navegador viu naquele dia.</p>
        </div>
        <span class="sub small">31 de agosto de 2026, 14h02 · lido de São Paulo</span>
      </div>

      <div class="card" style="gap: 22px">
        <div class="board">
          <div class="board-cell">
            <span class="num-lg">66<em> / 100</em></span>
            <span class="board-label">nota desta leitura</span>
          </div>
          <div class="board-cell">
            <span class="num-md">24<em>/45</em></span>
            <span class="board-label">o que a loja faz</span>
          </div>
          <div class="board-cell">
            <span class="num-md">42<em>/55</em></span>
            <span class="board-label">o que a loja declara</span>
          </div>
        </div>
        <p class="sub small" style="max-width: 660px">Esta pontuação é uma leitura técnica composta pelo bugsniff a partir do que o navegador observou. Não constitui parecer jurídico nem avaliação da situação legal da loja. Nesta leitura deu para medir os 100 pontos.</p>
      </div>

${half("O que a loja faz", "O que o navegador viu acontecer, antes e depois de responder ao banner.", 24, 45, FAZ)}

${half("O que a loja declara", "O que a política publicada diz, no texto que este exame leu e guardou.", 42, 55, DECLARA)}

      <div class="col" style="gap: 14px; padding-top: 8px">
        <div class="col" style="gap: 3px">
          <h2>As três marcas do card</h2>
          <p class="sub small" style="max-width: 760px">Ponto cheio, ponto que faltou e ponto que esta leitura não conseguiu medir. O terceiro é o que importa: leitura que não chegou à política é falha nossa, e não pode parecer ponto perdido pela loja.</p>
        </div>
        <div class="points" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
${point({
  label: "A política dá um canal de contato",
  earned: 6,
  weight: 6,
  detail: "O texto da política cobre este ponto.",
  norm: "LGPD, art. 9º, IV",
})}
${point({
  state: "gap",
  label: "A política informa o encarregado",
  earned: 0,
  weight: 4,
  detail: "Não encontramos este ponto no texto da política.",
  norm: "LGPD, art. 41",
})}
${point({
  state: "unmeasured",
  label: "A política nomeia o que a loja usa",
  detail:
    "Sem a política lida, não há o que comparar. Nosso navegador não chegou nela a partir da home, o que não quer dizer que ela não exista.",
  norm: "LGPD, art. 9º, V e art. 6º, VI",
})}
        </div>
      </div>`,
  });
