// Lojas, documentos, banner, jurídico, conta — e os três e-mails.
import { artboard, screen, icon } from "./_parts.mjs";

const S = { store: "casadobolo.com.br" };

/* ------------------------------------------------------------- relatório */

export const Relatorio = (dark = false) =>
  screen({
    dark,
    active: "relatorios",
    store: S.store,
    crumbs: `casadobolo.com.br <span>/</span> <strong>Relatório</strong>`,
    actions: `<a class="btn outline sm" href="#">${icon("eye", 14)} Prévia</a><a class="btn sm" href="#">${icon("doc", 14)} Baixar PDF</a>`,
    page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Relatório de 31 de agosto</h1>
          <p class="sub">Gerado a partir do exame das 14h02. Um relatório é uma leitura congelada: reexaminar a loja cria outro, não altera este.</p>
        </div>
        <span class="tag lg outline">rascunho</span>
      </div>

      <div class="row" style="align-items: flex-start">
        <div class="col" style="flex: 1; gap: 16px">
          <div class="card" style="gap: 18px">
            <div class="col" style="gap: 6px">
              <span class="sub small">casadobolo.com.br · leitura de 31 ago 2026</span>
              <h2 style="font-size: 24px; letter-spacing: -0.02em">O que esta loja faz, e o que ela declara</h2>
            </div>
            <div class="sep"></div>
            <div class="col" style="gap: 10px">
              <h3>Resumo da leitura</h3>
              <p class="lede" style="text-wrap: pretty">A loja gravou 33 cookies e contactou 34 endereços de terceiros antes de qualquer interação com o banner de consentimento. Entre eles, sete pertencem a serviços de medição e publicidade nomeados: Meta Pixel, Hotjar, Google Analytics, Google Ads, Criteo, TikTok e Google DoubleClick.</p>
              <p class="lede sub" style="text-wrap: pretty">A política de privacidade publicada foi localizada e lida. Ela cita Google Analytics e Meta; não cita Hotjar, Criteo nem TikTok.</p>
            </div>
            <div class="sep"></div>
            <div class="col" style="gap: 10px">
              <h3>Achado 1 — Meta Pixel antes do consentimento</h3>
              <p>O cookie <span class="mono small">_fbp</span> foi gravado antes de qualquer interação com o banner.</p>
              <blockquote style="margin: 0; padding: 12px 16px; border-radius: 12px; background: var(--muted); color: var(--muted-foreground)">“Recomenda-se que os cookies baseados no consentimento estejam desativados por padrão.” — Guia Orientativo de Cookies, ANPD</blockquote>
            </div>
          </div>
        </div>

        <div class="col" style="width: 300px; gap: 16px">
          <div class="card sm" style="gap: 12px">
            <span class="card-title">O que entra</span>
            <div class="col" style="gap: 10px">
              <label class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Leitura completa de cookies</label>
              <label class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Terceiros contactados</label>
              <label class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Prints das duas leituras</label>
              <label class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Trechos das normas citadas</label>
              <label class="row dim" style="gap: 8px; align-items: center"><span style="width: 15px"></span> Texto integral da política</label>
            </div>
          </div>
          <div class="card sm" style="gap: 8px">
            <span class="card-title">Marca</span>
            <p class="sub small">Este relatório sai com a marca da Agência Caravela. O lojista não vê o bugsniff em lugar nenhum.</p>
            <a class="btn outline sm" href="#">Trocar marca</a>
          </div>
        </div>
      </div>`,
  });

export const RelatorioWhiteLabel = artboard({
  extra: `.paper { background: var(--card); width: 794px; padding: 56px; display: flex; flex-direction: column; gap: 28px; box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent); }`,
  body: `  <div class="col" style="width: 100%; align-items: center; background: var(--muted); padding: 40px 0">
    <div class="paper">
      <div class="between" style="align-items: flex-start">
        <div class="col" style="gap: 2px">
          <span style="font-family: 'Noto Sans', sans-serif; font-size: 18px; font-weight: 600">Agência Caravela</span>
          <span class="sub small">Relatório de conformidade digital</span>
        </div>
        <div class="col" style="text-align: right; gap: 2px">
          <span class="small">casadobolo.com.br</span>
          <span class="sub small">31 de agosto de 2026</span>
        </div>
      </div>

      <div class="sep"></div>

      <div class="col" style="gap: 12px">
        <h1 style="font-size: 28px; letter-spacing: -0.02em; line-height: 1.15">O que esta loja faz, e o que ela declara</h1>
        <p class="lede sub" style="text-wrap: pretty">Este documento relata fatos observados por um navegador real em 31 de agosto de 2026, ao lado das normas que tratam de cada um. Não constitui parecer jurídico nem avaliação da situação legal da loja.</p>
      </div>

      <div class="row" style="gap: 12px">
        <div class="col" style="flex: 1; gap: 2px; padding: 14px; border-radius: 12px; background: var(--muted)">
          <span class="num" style="font-size: 24px; font-weight: 600">33</span>
          <span class="sub small">cookies antes do consentimento</span>
        </div>
        <div class="col" style="flex: 1; gap: 2px; padding: 14px; border-radius: 12px; background: var(--muted)">
          <span class="num" style="font-size: 24px; font-weight: 600">34</span>
          <span class="sub small">terceiros contactados antes</span>
        </div>
        <div class="col" style="flex: 1; gap: 2px; padding: 14px; border-radius: 12px; background: color-mix(in oklab, var(--primary) 28%, transparent)">
          <span class="num" style="font-size: 24px; font-weight: 600">7</span>
          <span class="small">rastreadores nomeados</span>
        </div>
      </div>

      <div class="col" style="gap: 10px">
        <h2>Achado 1 — Meta Pixel gravado antes do consentimento</h2>
        <p><strong style="font-weight: 500">Fato observado.</strong> O cookie <span class="mono small">_fbp</span> foi gravado no navegador antes de qualquer interação com o banner, e <span class="mono small">connect.facebook.net</span> foi contactado no mesmo momento.</p>
        <p><strong style="font-weight: 500">Norma citada.</strong> Guia Orientativo de Cookies e Proteção de Dados Pessoais, ANPD:</p>
        <blockquote style="margin: 0; padding: 14px 18px; border-radius: 12px; background: var(--muted); color: var(--muted-foreground)">“Recomenda-se que os cookies baseados no consentimento estejam desativados por padrão.”</blockquote>
      </div>

      <div class="col" style="gap: 10px">
        <h2>A loja no momento da leitura</h2>
        <div class="shot">
          <div class="shot-body" style="gap: 8px">
            <div class="block" style="height: 70px"></div>
            <div class="shot-banner"><span class="dim">Usamos cookies para melhorar sua experiência.</span><span class="shot-pill"></span></div>
          </div>
        </div>
        <p class="sub small">A imagem mostra a tela que o visitante via enquanto os 33 cookies acima já estavam gravados. Ela não mostra os cookies: cookie é invisível.</p>
      </div>

      <div class="sep"></div>
      <p class="sub small">Agência Caravela · contato@agenciacaravela.com.br · Relatório gerado em 31/08/2026</p>
    </div>
  </div>`,
});

export const Monitoramento = screen({
  active: "monitoramento",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> <strong>Monitoramento</strong>`,
  actions: `<a class="btn sm" href="#">Salvar</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Monitoramento</h1>
          <p class="sub" style="max-width: 700px">Uma loja muda sem avisar: um app novo instalado no sábado coloca um pixel que não estava lá na sexta. O monitoramento reexamina no intervalo escolhido e avisa quando a leitura muda.</p>
        </div>
      </div>

      <div class="card" style="gap: 18px; max-width: 720px">
        <div class="col" style="gap: 8px">
          <label class="label">Com que frequência</label>
          <div class="row" style="gap: 8px">
            <span class="btn secondary sm">Diário</span>
            <span class="btn sm">Semanal</span>
            <span class="btn secondary sm">Mensal</span>
            <span class="btn secondary sm">Desligado</span>
          </div>
        </div>
        <div class="sep"></div>
        <div class="col" style="gap: 10px">
          <label class="label">Avisar quando</label>
          <div class="col" style="gap: 8px">
            <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Um rastreador novo aparecer antes do consentimento</span>
            <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> O banner deixar de ser encontrado</span>
            <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> A política publicada mudar</span>
            <span class="row dim" style="gap: 8px; align-items: center"><span style="width: 15px"></span> Qualquer cookie novo, mesmo sem nome conhecido</span>
          </div>
        </div>
      </div>

      <div class="card flush" style="max-width: 720px">
        <div class="card-head"><span class="card-title">Mudanças recentes</span></div>
        <table>
          <tbody>
            <tr><td class="dim small" style="width: 120px">24 ago</td><td>Criteo apareceu antes do consentimento</td></tr>
            <tr><td class="dim small">17 ago</td><td>O banner deixou de ser reconhecido pelo exame</td></tr>
            <tr><td class="dim small">03 ago</td><td>A política publicada mudou de endereço</td></tr>
          </tbody>
        </table>
      </div>`,
});

/* ----------------------------------------------------------------- lojas */

export const Lojas = screen({
  active: "lojas",
  store: S.store,
  crumbs: `<strong>Lojas</strong>`,
  actions: `<a class="btn" href="#">${icon("plus")} Adicionar loja</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Lojas</h1>
          <p class="sub">38 lojas nesta organização</p>
        </div>
        <div class="field" style="width: 260px">${icon("scan", 15)} Buscar por endereço</div>
      </div>

      <div class="card flush">
        <table>
          <thead><tr><th>Loja</th><th>Plataforma</th><th>Último exame</th><th>Antes do consentimento</th><th>Monitoramento</th><th></th></tr></thead>
          <tbody>
            <tr><td class="mono small">casadobolo.com.br</td><td>Nuvemshop</td><td class="dim">há 12 min</td><td><span class="tag pre">7 rastreadores</span></td><td class="dim">semanal</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td class="mono small">ateliedaflor.com.br</td><td>Shopify</td><td class="dim">há 1 h</td><td><span class="tag pre">4 rastreadores</span></td><td class="dim">semanal</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td class="mono small">vinhosdaserra.com.br</td><td>WooCommerce</td><td class="dim">há 3 h</td><td><span class="tag pre">11 rastreadores</span></td><td class="dim">diário</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td class="mono small">livrariadaesquina.com.br</td><td>Wix</td><td class="dim">ontem</td><td class="dim">nenhum</td><td class="dim">mensal</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td class="mono small">petshopdobairro.com.br</td><td class="dim">não conectada</td><td class="dim">há 5 h</td><td><span class="tag bad">não medido</span></td><td class="dim">desligado</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
          </tbody>
        </table>
      </div>`,
});

export const Loja = screen({
  active: "lojas",
  store: S.store,
  crumbs: `Lojas <span>/</span> <strong>casadobolo.com.br</strong>`,
  actions: `<a class="btn outline sm" href="#">${icon("refresh", 14)} Examinar agora</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">casadobolo.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag outline">Nuvemshop</span>
            <span class="tag outline">conectada</span>
            <span class="sub small">desde 12 de julho</span>
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="card sm" style="gap: 8px">
          <h3>Última leitura</h3>
          <p><span class="tag pre">7 rastreadores antes</span></p>
          <p class="sub small">31 ago, 14h02 · banner aceito</p>
        </div>
        <div class="card sm" style="gap: 8px">
          <h3>Documentos</h3>
          <p>Política v3 · Termos v1</p>
          <p class="sub small">publicados na loja</p>
        </div>
        <div class="card sm" style="gap: 8px">
          <h3>Banner</h3>
          <p>Ativo, 12 rastreadores bloqueados</p>
          <p class="sub small">instalado em 14 de julho</p>
        </div>
      </div>

      <div class="card" style="gap: 14px">
        <span class="card-title">Conexão</span>
        <div class="between">
          <div class="col" style="gap: 2px">
            <span>Autorização concedida pelo lojista</span>
            <span class="sub small">Permite instalar o banner e substituir a página de política. Não dá acesso a pedidos nem a dados de clientes.</span>
          </div>
          <a class="btn danger sm" href="#">Revogar</a>
        </div>
      </div>`,
});

export const ConectarPlataforma = screen({
  active: "lojas",
  store: S.store,
  crumbs: `Lojas <span>/</span> <strong>Adicionar loja</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Em qual plataforma esta loja roda?</h1>
          <p class="sub" style="max-width: 640px">A conexão é o que permite instalar o banner e substituir a página de política. Sem ela o exame continua funcionando — ele só olha de fora, como qualquer visitante.</p>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 900px">
        <div class="card sm" style="gap: 10px; align-items: flex-start">
          <span class="brand-mark" style="background: var(--muted); color: var(--muted-foreground); width: 36px; height: 36px; border-radius: 12px">${icon("store", 18)}</span>
          <span style="font-weight: 500">Nuvemshop</span>
          <span class="sub small">Instalação em um clique</span>
        </div>
        <div class="card sm" style="gap: 10px; align-items: flex-start">
          <span class="brand-mark" style="background: var(--muted); color: var(--muted-foreground); width: 36px; height: 36px; border-radius: 12px">${icon("store", 18)}</span>
          <span style="font-weight: 500">Shopify</span>
          <span class="sub small">Instalação em um clique</span>
        </div>
        <div class="card sm" style="gap: 10px; align-items: flex-start">
          <span class="brand-mark" style="background: var(--muted); color: var(--muted-foreground); width: 36px; height: 36px; border-radius: 12px">${icon("store", 18)}</span>
          <span style="font-weight: 500">WooCommerce</span>
          <span class="sub small">Plugin no WordPress</span>
        </div>
        <div class="card sm" style="gap: 10px; align-items: flex-start">
          <span class="brand-mark" style="background: var(--muted); color: var(--muted-foreground); width: 36px; height: 36px; border-radius: 12px">${icon("store", 18)}</span>
          <span style="font-weight: 500">Wix</span>
          <span class="sub small">App no painel da Wix</span>
        </div>
      </div>

      <div class="card sm" style="max-width: 900px; flex-direction: row; gap: 10px; align-items: flex-start">
        <span class="dim" style="margin-top: 2px">${icon("alert", 18)}</span>
        <div class="col" style="gap: 2px">
          <span style="font-weight: 500">A loja roda em outra coisa?</span>
          <span class="sub">Dá para examinar mesmo assim — só cole o endereço. Banner e substituição de política ficam de fora até existir conexão.</span>
        </div>
        <a class="btn outline sm" href="#" style="margin-left: auto">Só examinar</a>
      </div>`,
});

export const ConectarAutorizacao = screen({
  active: "lojas",
  store: S.store,
  crumbs: `Lojas <span>/</span> Adicionar loja <span>/</span> <strong>Nuvemshop</strong>`,
  page: `      <div class="col" style="max-width: 620px; gap: 20px">
        <div class="col" style="gap: 6px">
          <h1>Autorizar na Nuvemshop</h1>
          <p class="sub">Você vai para a Nuvemshop, entra com a conta da loja e volta para cá. Leva menos de um minuto.</p>
        </div>

        <div class="card" style="gap: 14px">
          <span class="card-title">O que o bugsniff vai poder fazer</span>
          <div class="col" style="gap: 10px">
            <span class="row" style="gap: 10px; align-items: flex-start"><span style="color: var(--sidebar-primary); margin-top: 2px">${icon("check", 15)}</span><span class="col" style="gap: 1px"><span>Instalar o banner de consentimento</span><span class="sub small">um script na loja, que você desliga quando quiser</span></span></span>
            <span class="row" style="gap: 10px; align-items: flex-start"><span style="color: var(--sidebar-primary); margin-top: 2px">${icon("check", 15)}</span><span class="col" style="gap: 1px"><span>Substituir a página de política de privacidade</span><span class="sub small">só essa página, e sempre com a sua confirmação</span></span></span>
          </div>
          <div class="sep"></div>
          <span class="card-title">O que ele não pede</span>
          <div class="col" style="gap: 10px">
            <span class="row dim" style="gap: 10px; align-items: center"><span style="width: 15px; text-align: center">—</span> Pedidos, clientes ou dados de pagamento</span>
            <span class="row dim" style="gap: 10px; align-items: center"><span style="width: 15px; text-align: center">—</span> Publicar produto ou alterar preço</span>
          </div>
        </div>

        <div class="row" style="gap: 10px">
          <a class="btn lg" href="#">${icon("external", 15)} Continuar na Nuvemshop</a>
          <a class="btn outline lg" href="#">Cancelar</a>
        </div>
      </div>`,
});

/* ------------------------------------------------------------ documentos */

export const Documentos = screen({
  active: "documentos",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> <strong>Documentos</strong>`,
  actions: `<a class="btn" href="#">${icon("plus")} Nova versão</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Documentos</h1>
          <p class="sub" style="max-width: 700px">Política de privacidade e termos de uso gerados para esta loja. Cada versão é imutável: é a ela que uma revisão jurídica se refere, e é ela que fica publicada.</p>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
        <div class="card" style="gap: 14px">
          <div class="between">
            <span class="card-title">Política de privacidade</span>
            <span class="tag outline">v3 publicada</span>
          </div>
          <p class="sub">Gerada em 20 de agosto a partir da leitura de 17 de agosto. Cita 7 serviços de terceiros por nome.</p>
          <div class="row" style="gap: 8px">
            <a class="btn outline sm" href="#">Ver versão</a>
            <a class="btn outline sm" href="#">Histórico</a>
          </div>
        </div>
        <div class="card" style="gap: 14px">
          <div class="between">
            <span class="card-title">Termos de uso</span>
            <span class="tag outline">v1 publicada</span>
          </div>
          <p class="sub">Gerada em 12 de julho. Sem revisão jurídica.</p>
          <div class="row" style="gap: 8px">
            <a class="btn outline sm" href="#">Ver versão</a>
            <a class="btn outline sm" href="#">Histórico</a>
          </div>
        </div>
      </div>

      <div class="card flush">
        <div class="card-head"><span class="card-title">Histórico da política</span></div>
        <table>
          <thead><tr><th>Versão</th><th>Gerada em</th><th>Revisão jurídica</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            <tr><td>v3</td><td>20 ago 2026</td><td><span class="tag outline">com parecer</span></td><td>publicada na loja</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td>v2</td><td>02 ago 2026</td><td class="dim">—</td><td class="dim">substituída</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
            <tr><td>v1</td><td>12 jul 2026</td><td class="dim">—</td><td class="dim">substituída</td><td style="text-align: right"><a class="btn ghost xs" href="#">Abrir</a></td></tr>
          </tbody>
        </table>
      </div>`,
});

export const VersaoDocumento = screen({
  active: "documentos",
  store: S.store,
  crumbs: `Documentos <span>/</span> Política <span>/</span> <strong>v3</strong>`,
  actions: `<a class="btn outline sm" href="#">${icon("scale", 14)} Pedir revisão jurídica</a><a class="btn sm" href="#">Publicar na loja</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1>Política de privacidade, v3</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag outline">imutável</span>
            <span class="sub small">gerada em 20 ago 2026 · publicada na loja</span>
          </div>
        </div>
      </div>

      <div class="row" style="align-items: flex-start">
        <div class="card" style="flex: 1; gap: 16px">
          <div class="col" style="gap: 10px">
            <h2>1. Quem trata os seus dados</h2>
            <p class="sub">Casa do Bolo Comércio de Alimentos Ltda., CNPJ [PREENCHER], com sede em [PREENCHER].</p>
            <h2>2. O que é coletado quando você navega</h2>
            <p class="sub">Ao visitar esta loja, os seguintes serviços de terceiros podem gravar cookies ou receber informações sobre a sua navegação: Meta Pixel, Google Analytics, Google Ads, Hotjar, Criteo, TikTok e Google DoubleClick.</p>
            <h2>3. Cookies e consentimento</h2>
            <p class="sub">Cookies que dependem de consentimento permanecem desativados até que você aceite pelo banner.</p>
          </div>
        </div>
        <div class="col" style="width: 300px; gap: 16px">
          <div class="card sm" style="gap: 10px">
            <span class="card-title">De onde veio</span>
            <p class="sub small">Os sete serviços citados na seção 2 vieram da leitura de 17 de agosto — não de uma lista genérica.</p>
            <a class="btn outline sm" href="#">Ver o exame</a>
          </div>
          <div class="card sm" style="gap: 10px">
            <span class="card-title">Revisão jurídica</span>
            <p class="sub small">Parecer de 22 de agosto, com 3 pontos apontados.</p>
            <a class="btn outline sm" href="#">Ler o parecer</a>
          </div>
        </div>
      </div>`,
});

export const PublicarNaLoja = screen({
  active: "documentos",
  store: S.store,
  crumbs: `Documentos <span>/</span> Política v3 <span>/</span> <strong>Publicar</strong>`,
  page: `      <div class="col" style="max-width: 700px; gap: 20px">
        <div class="col" style="gap: 6px">
          <h1>Publicar a v3 na loja</h1>
          <p class="sub">A página de política da loja passa a mostrar este texto. A versão que está lá hoje continua guardada aqui e pode voltar a qualquer momento.</p>
        </div>

        <div class="card" style="gap: 0; padding: 0">
          <div class="between" style="padding: 16px 20px">
            <div class="col" style="gap: 2px"><span class="sub small">Está publicado hoje</span><span>Política v2 · 02 de agosto</span></div>
            <span class="tag outline">no ar</span>
          </div>
          <div class="sep"></div>
          <div class="between" style="padding: 16px 20px">
            <div class="col" style="gap: 2px"><span class="sub small">Vai para o ar</span><span>Política v3 · 20 de agosto</span></div>
            <span class="tag pre">com parecer jurídico</span>
          </div>
        </div>

        <div class="card sm" style="flex-direction: row; gap: 10px; align-items: flex-start">
          <span class="dim" style="margin-top: 2px">${icon("alert", 18)}</span>
          <p class="sub">Publicar substitui o conteúdo da página <span class="mono small">/politica-de-privacidade</span> na Nuvemshop. O endereço não muda, então links antigos continuam valendo.</p>
        </div>

        <div class="row" style="gap: 10px">
          <a class="btn lg" href="#">Publicar agora</a>
          <a class="btn outline lg" href="#">Cancelar</a>
        </div>
      </div>`,
});

/* ---------------------------------------------------------------- banner */

export const BannerConfiguracao = screen({
  active: "banner",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> <strong>Banner</strong>`,
  actions: `<a class="btn outline sm" href="#">${icon("eye", 14)} Prévia</a><a class="btn sm" href="#">Salvar</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Banner de consentimento</h1>
          <p class="sub" style="max-width: 700px">O banner é o que impede o rastreador de disparar antes da resposta. É também o que o próximo exame vai medir: se ele funciona, a leitura pré-consentimento fica vazia.</p>
        </div>
        <span class="tag lg outline">ativo desde 14 de julho</span>
      </div>

      <div class="row" style="align-items: flex-start">
        <div class="col" style="flex: 1; gap: 16px">
          <div class="card" style="gap: 16px">
            <span class="card-title">Texto</span>
            <div class="col" style="gap: 6px">
              <label class="label">O que o banner diz</label>
              <div class="field tall filled" style="height: 74px">Usamos cookies para medir audiência e mostrar anúncios. Você escolhe o que aceitar.</div>
            </div>
            <div class="row" style="gap: 12px">
              <div class="col" style="flex: 1; gap: 6px"><label class="label">Botão de aceite</label><div class="field filled">Aceitar tudo</div></div>
              <div class="col" style="flex: 1; gap: 6px"><label class="label">Botão de recusa</label><div class="field filled">Recusar</div></div>
            </div>
          </div>

          <div class="card" style="gap: 14px">
            <span class="card-title">Comportamento</span>
            <div class="col" style="gap: 10px">
              <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Bloquear os rastreadores da lista até haver resposta</span>
              <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Guardar a escolha por 6 meses</span>
              <span class="row" style="gap: 8px; align-items: center"><span style="color: var(--sidebar-primary)">${icon("check", 15)}</span> Deixar a pessoa mudar de ideia por um link no rodapé</span>
            </div>
          </div>
        </div>

        <div class="col" style="width: 340px; gap: 10px">
          <h3>Como fica na loja</h3>
          <div class="shot">
            <div class="shot-bar"><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-url mono">casadobolo.com.br</span></div>
            <div class="shot-body">
              <div class="block" style="height: 60px"></div>
              <div class="row" style="gap: 6px"><div class="block" style="flex: 1; height: 34px"></div><div class="block" style="flex: 1; height: 34px"></div></div>
              <div class="shot-banner" style="flex-direction: column; align-items: stretch; gap: 8px">
                <span>Usamos cookies para medir audiência e mostrar anúncios. Você escolhe o que aceitar.</span>
                <span class="row" style="gap: 6px; justify-content: flex-end">
                  <span class="btn outline xs">Recusar</span>
                  <span class="btn xs">Aceitar tudo</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>`,
});

export const BannerBloqueio = screen({
  active: "banner",
  store: S.store,
  crumbs: `Banner <span>/</span> <strong>Lista de bloqueio</strong>`,
  actions: `<a class="btn sm" href="#">Salvar</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Lista de bloqueio</h1>
          <p class="sub" style="max-width: 720px">A lista não foi inventada: são os rastreadores que o exame encontrou nesta loja. Cada linha bloqueada deixa de disparar até a pessoa responder o banner.</p>
        </div>
      </div>

      <div class="card flush">
        <div class="card-head">
          <span class="card-title">Encontrados no exame de 31 de agosto</span>
          <span class="tag pre">7 disparavam antes da resposta</span>
        </div>
        <table>
          <thead><tr><th>Rastreador</th><th>Como aparece</th><th>Bloqueado até responder</th></tr></thead>
          <tbody>
            <tr><td>Meta Pixel</td><td class="dim mono small">_fbp · connect.facebook.net</td><td><span class="tag pre">bloqueado</span></td></tr>
            <tr><td>Hotjar</td><td class="dim mono small">_hjSessionUser · script.hotjar.com</td><td><span class="tag pre">bloqueado</span></td></tr>
            <tr><td>Google Analytics</td><td class="dim mono small">_ga · google-analytics.com</td><td><span class="tag pre">bloqueado</span></td></tr>
            <tr><td>Criteo</td><td class="dim mono small">cto_bundle · static.criteo.net</td><td><span class="tag pre">bloqueado</span></td></tr>
            <tr><td>TikTok</td><td class="dim mono small">_ttp · analytics.tiktok.com</td><td><span class="tag pre">bloqueado</span></td></tr>
            <tr><td class="dim">titanpush.com</td><td class="dim mono small">track.titanpush.com</td><td><span class="tag outline">liberado</span></td></tr>
            <tr><td class="dim">Sessão da loja</td><td class="dim mono small">session · casadobolo.com.br</td><td><span class="tag outline">nunca bloqueado</span></td></tr>
          </tbody>
        </table>
      </div>

      <p class="sub small" style="max-width: 720px">O cookie que faz a loja funcionar — sessão, carrinho, token de formulário — não entra na lista. Bloquear esses quebraria a loja, e eles não dependem de consentimento.</p>`,
});

export const BannerPrevia = artboard({
  body: `  <div class="col" style="width: 100%; background: var(--muted); align-items: center; justify-content: center; padding: 40px; gap: 20px">
    <div class="row" style="gap: 8px; align-items: center">
      <span class="tag outline">Prévia</span>
      <span class="sub small">como o visitante vê, antes de responder qualquer coisa</span>
    </div>
    <div class="shot" style="width: 900px">
      <div class="shot-bar"><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-url mono">casadobolo.com.br</span></div>
      <div class="shot-body" style="gap: 14px; padding: 20px; position: relative">
        <div class="row" style="gap: 10px; align-items: center">
          <div class="block" style="width: 120px; height: 20px"></div>
          <div class="bar" style="flex: 1; max-width: 260px"></div>
          <div class="block" style="width: 70px; height: 20px; margin-left: auto"></div>
        </div>
        <div class="block" style="height: 180px"></div>
        <div class="row" style="gap: 12px">
          <div class="block" style="flex: 1; height: 90px"></div>
          <div class="block" style="flex: 1; height: 90px"></div>
          <div class="block" style="flex: 1; height: 90px"></div>
        </div>
        <div class="card sm" style="gap: 12px; position: sticky; bottom: 0">
          <div class="between" style="align-items: flex-start; gap: 20px">
            <div class="col" style="gap: 4px">
              <span style="font-weight: 500">Usamos cookies para medir audiência e mostrar anúncios.</span>
              <span class="sub small">Você escolhe o que aceitar. Enquanto não responder, nada é acionado além do necessário para a loja funcionar.</span>
            </div>
            <div class="row" style="gap: 8px">
              <span class="btn outline sm">Recusar</span>
              <span class="btn outline sm">Escolher</span>
              <span class="btn sm">Aceitar tudo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
});

/* -------------------------------------------------------------- jurídico */

export const RevisaoPedir = screen({
  active: "documentos",
  store: S.store,
  crumbs: `Documentos <span>/</span> Política v3 <span>/</span> <strong>Revisão jurídica</strong>`,
  page: `      <div class="col" style="max-width: 640px; gap: 20px">
        <div class="col" style="gap: 6px">
          <h1>Pedir revisão jurídica</h1>
          <p class="sub">Um advogado externo lê esta versão do documento e aponta o que mudar. A revisão é sobre o texto, não sobre a loja: ela não atesta conformidade de nada.</p>
        </div>

        <div class="card" style="gap: 14px">
          <div class="between"><span class="card-title">Política de privacidade, v3</span><span class="tag outline">imutável</span></div>
          <p class="sub small">O parecer vai se referir a esta versão exata. Gerar uma v4 depois não invalida o parecer — ele continua apontando para a v3.</p>
          <div class="sep"></div>
          <div class="between"><span>Prazo</span><span>até 3 dias úteis</span></div>
          <div class="between"><span>Valor</span><span class="num">R$ [PREENCHER]</span></div>
        </div>

        <div class="col" style="gap: 6px">
          <label class="label">Algo que o advogado deva saber?</label>
          <div class="field tall" style="height: 84px">Opcional</div>
        </div>

        <div class="row" style="gap: 10px">
          <a class="btn lg" href="#">Pedir revisão</a>
          <a class="btn outline lg" href="#">Cancelar</a>
        </div>
      </div>`,
});

export const RevisaoParecer = screen({
  active: "documentos",
  store: S.store,
  crumbs: `Documentos <span>/</span> Política v3 <span>/</span> <strong>Parecer</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1>Parecer sobre a política v3</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag outline">22 de agosto</span>
            <span class="sub small">[NOME DO ADVOGADO] · OAB/[UF] [NÚMERO]</span>
          </div>
        </div>
      </div>

      <div class="card sm" style="flex-direction: row; gap: 10px; align-items: flex-start; max-width: 820px">
        <span class="dim" style="margin-top: 2px">${icon("scale", 18)}</span>
        <p class="sub">Uma revisão jurídica lê o documento e aponta mudanças. Ela não atesta que a loja esteja em conformidade — nada aqui faz isso.</p>
      </div>

      <div class="col" style="gap: 12px; max-width: 820px">
        <div class="card" style="gap: 10px">
          <div class="between"><span class="card-title">1. Seção 2 — serviços citados</span><span class="tag outline">ajuste sugerido</span></div>
          <p class="sub">A lista de serviços está correta, mas convém indicar a finalidade de cada um, e não apenas o nome.</p>
        </div>
        <div class="card" style="gap: 10px">
          <div class="between"><span class="card-title">2. Seção 4 — prazo de retenção</span><span class="tag outline">ajuste sugerido</span></div>
          <p class="sub">Não há menção ao prazo de guarda dos dados coletados por cookies.</p>
        </div>
        <div class="card" style="gap: 10px">
          <div class="between"><span class="card-title">3. Seção 6 — canal do titular</span><span class="tag outline">ajuste sugerido</span></div>
          <p class="sub">Indicar um canal específico para pedidos do titular, distinto do e-mail comercial da loja.</p>
        </div>
      </div>

      <div class="row" style="gap: 10px">
        <a class="btn" href="#">Gerar v4 com os ajustes</a>
        <a class="btn outline" href="#">Baixar parecer</a>
      </div>`,
});

/* ------------------------------------------------------------ organização */

export const Membros = screen({
  active: "membros",
  store: S.store,
  crumbs: `<strong>Membros</strong>`,
  actions: `<a class="btn" href="#">${icon("plus")} Convidar</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Membros</h1>
          <p class="sub" style="max-width: 700px">Convite é o único caminho de entrada numa organização que a pessoa não criou. Só o proprietário convida.</p>
        </div>
      </div>

      <div class="card flush">
        <table>
          <thead><tr><th>Pessoa</th><th>Papel</th><th>Entrou</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td><span class="row" style="gap: 10px; align-items: center"><span class="who-avatar">MC</span><span class="col" style="gap: 0"><span>marina@agenciacaravela.com.br</span><span class="sub small">você</span></span></span></td>
              <td><span class="tag outline">proprietária</span></td>
              <td class="dim">12 jul 2026</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Transferir propriedade</a></td>
            </tr>
            <tr>
              <td><span class="row" style="gap: 10px; align-items: center"><span class="who-avatar">RS</span><span>rafael@agenciacaravela.com.br</span></span></td>
              <td><span class="tag">membro</span></td>
              <td class="dim">14 jul 2026</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Remover</a></td>
            </tr>
            <tr>
              <td><span class="row" style="gap: 10px; align-items: center"><span class="who-avatar" style="background: var(--muted)">—</span><span class="dim">bruno@agenciacaravela.com.br</span></span></td>
              <td><span class="tag outline">convite enviado</span></td>
              <td class="dim">há 2 dias</td>
              <td style="text-align: right"><a class="btn ghost xs" href="#">Reenviar</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card sm" style="flex-direction: row; gap: 10px; align-items: flex-start; max-width: 760px">
        <span class="dim" style="margin-top: 2px">${icon("alert", 18)}</span>
        <p class="sub">A organização morre com o proprietário: se essa conta for apagada, as lojas, exames e documentos vão junto. Transferir a propriedade antes é o caminho.</p>
      </div>`,
});

export const Plano = screen({
  active: "plano",
  store: S.store,
  crumbs: `<strong>Plano</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Plano e uso</h1>
          <p class="sub">Agência · 38 de 50 lojas · renova em 12 de setembro</p>
        </div>
        <a class="btn outline" href="#">Ver faturas</a>
      </div>

      <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="card sm" style="gap: 10px">
          <h3>Lojas</h3>
          <div class="col" style="gap: 6px">
            <span class="num" style="font-size: 26px; font-weight: 600">38 <span class="sub" style="font-size: 14px; font-weight: 400">de 50</span></span>
            <div style="height: 6px; border-radius: 999px; background: var(--muted)"><div style="width: 76%; height: 6px; border-radius: 999px; background: var(--primary)"></div></div>
          </div>
        </div>
        <div class="card sm" style="gap: 10px">
          <h3>Exames este mês</h3>
          <div class="col" style="gap: 6px">
            <span class="num" style="font-size: 26px; font-weight: 600">412 <span class="sub" style="font-size: 14px; font-weight: 400">de 1.000</span></span>
            <div style="height: 6px; border-radius: 999px; background: var(--muted)"><div style="width: 41%; height: 6px; border-radius: 999px; background: var(--primary)"></div></div>
          </div>
        </div>
        <div class="card sm" style="gap: 10px">
          <h3>Revisões jurídicas</h3>
          <div class="col" style="gap: 6px">
            <span class="num" style="font-size: 26px; font-weight: 600">2 <span class="sub" style="font-size: 14px; font-weight: 400">avulsas</span></span>
            <span class="sub small">cobradas por uso</span>
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="card" style="gap: 12px">
          <div class="col" style="gap: 2px"><span class="card-title">Lojista</span><span class="sub small">uma loja</span></div>
          <span class="num" style="font-size: 24px; font-weight: 600">R$ [PREENCHER]<span class="sub" style="font-size: 13px; font-weight: 400">/mês</span></span>
          <div class="col" style="gap: 8px">
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Exame semanal</span>
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Banner e documentos</span>
          </div>
          <a class="btn outline sm" href="#">Trocar para este</a>
        </div>
        <div class="card" style="gap: 12px; box-shadow: 0 0 0 2px var(--primary)">
          <div class="between"><div class="col" style="gap: 2px"><span class="card-title">Agência</span><span class="sub small">até 50 lojas</span></div><span class="tag pre">seu plano</span></div>
          <span class="num" style="font-size: 24px; font-weight: 600">R$ [PREENCHER]<span class="sub" style="font-size: 13px; font-weight: 400">/mês</span></span>
          <div class="col" style="gap: 8px">
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Exame diário</span>
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Relatório com a sua marca</span>
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Membros ilimitados</span>
          </div>
          <a class="btn sm" href="#">Plano atual</a>
        </div>
        <div class="card" style="gap: 12px">
          <div class="col" style="gap: 2px"><span class="card-title">Sob medida</span><span class="sub small">acima de 50 lojas</span></div>
          <span style="font-size: 24px; font-weight: 600; font-family: 'Noto Sans', sans-serif">Falar com a gente</span>
          <div class="col" style="gap: 8px">
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Limite combinado</span>
            <span class="row" style="gap: 8px"><span class="dim">${icon("check", 15)}</span> Faturamento por nota</span>
          </div>
          <a class="btn outline sm" href="#">Entrar em contato</a>
        </div>
      </div>`,
});

export const Conta = screen({
  active: "conta",
  store: S.store,
  crumbs: `<strong>Conta</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px"><h1>Conta</h1><p class="sub">Da sua pessoa e da organização.</p></div>
      </div>

      <div class="col" style="max-width: 700px; gap: 16px">
        <div class="card" style="gap: 14px">
          <span class="card-title">Você</span>
          <div class="col" style="gap: 6px">
            <label class="label">E-mail</label>
            <div class="field filled">marina@agenciacaravela.com.br</div>
            <p class="sub small">Este e-mail é a sua entrada: não existe senha, o link é que entra.</p>
          </div>
        </div>

        <div class="card" style="gap: 14px">
          <span class="card-title">Organização</span>
          <div class="col" style="gap: 6px">
            <label class="label">Nome</label>
            <div class="field filled">Agência Caravela</div>
          </div>
          <div class="col" style="gap: 6px">
            <label class="label">Marca nos relatórios</label>
            <div class="row" style="gap: 10px; align-items: center">
              <span class="block" style="width: 48px; height: 48px; border-radius: 12px"></span>
              <a class="btn outline sm" href="#">Trocar logotipo</a>
            </div>
          </div>
        </div>

        <div class="card" style="gap: 12px">
          <span class="card-title" style="color: var(--destructive)">Apagar a organização</span>
          <p class="sub">As 38 lojas, todos os exames, documentos e prints vão junto, e não voltam. Se você quer sair mas manter a organização de pé, transfira a propriedade antes.</p>
          <a class="btn danger sm" href="#" style="align-self: flex-start">Apagar Agência Caravela</a>
        </div>
      </div>`,
});

/* --------------------------------------------------------------- estados */

const stateCard = (
  title,
  body,
  action
) => `        <div class="card" style="gap: 12px; align-items: center; text-align: center; padding: 40px 24px">
          <span class="brand-mark" style="width: 40px; height: 40px; border-radius: 14px; background: var(--muted); color: var(--muted-foreground)">${icon("scan", 20)}</span>
          <div class="col" style="gap: 6px">
            <span style="font-weight: 500">${title}</span>
            <span class="sub" style="max-width: 320px">${body}</span>
          </div>
          ${action}
        </div>`;

export const Estados = artboard({
  body: `  <div class="col" style="width: 100%; padding: 32px; gap: 20px; background: var(--background)">
    <div class="col" style="gap: 4px">
      <h1>Estados</h1>
      <p class="sub">Vazio, carregando, sem permissão e não medido — as telas que decidem se o produto parece cuidado ou improvisado.</p>
    </div>
    <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">
${stateCard("Nenhuma loja ainda", "Cole o endereço de uma loja para o primeiro exame. Não precisa conectar nada para começar.", '<a class="btn" href="#">Examinar uma loja</a>')}
${stateCard("Na fila", "Começa assim que uma vaga abrir. Esta página se atualiza sozinha — pode fechar e voltar depois.", '<span class="tag outline">aguardando</span>')}
${stateCard("Isto não é seu", "Este exame pertence a outra organização. Se acha que deveria ver, peça um convite a quem é proprietário.", '<a class="btn outline" href="#">Voltar ao painel</a>')}
${stateCard("O exame não aconteceu", "A loja respondeu ao nosso navegador com uma página de erro, não com a loja. Não é um exame limpo: é um exame que não aconteceu.", '<a class="btn outline" href="#">Ver o que o navegador recebeu</a>')}
    </div>
  </div>`,
});

/* --------------------------------------------------------------- e-mails */

const email = ({ preheader, title, body, cta, foot }) =>
  artboard({
    extra: `.mail { width: 600px; background: var(--card); border-radius: 18px; box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent); overflow: hidden; }`,
    body: `  <div class="col" style="width: 100%; background: var(--muted); align-items: center; padding: 40px 0; gap: 12px">
    <span class="sub small" style="width: 600px">${preheader}</span>
    <div class="mail">
      <div class="col" style="padding: 28px 32px; gap: 24px">
        <div class="row" style="align-items: center; gap: 8px">
          <span class="brand-mark">${icon("scan", 15)}</span>
          <span class="brand-name">bugsniff</span>
        </div>
        <div class="col" style="gap: 12px">
          <h1 style="font-size: 22px; letter-spacing: -0.015em">${title}</h1>
          ${body}
        </div>
        ${cta}
      </div>
      <div style="padding: 20px 32px; background: var(--muted)">
        <p class="sub small" style="text-wrap: pretty">${foot}</p>
      </div>
    </div>
    <span class="sub small" style="width: 600px; text-align: center">nao-responda@updates.bugsniff.com.br</span>
  </div>`,
  });

export const EmailMagicLink = email({
  preheader: "Seu link para ver o exame de casadobolo.com.br",
  title: "Seu link para entrar",
  body: `<p class="lede sub" style="text-wrap: pretty">Clique para ver o exame de <strong style="color: var(--foreground); font-weight: 500">casadobolo.com.br</strong>. O exame começa a rodar quando você clicar — nada sobe antes disso.</p>`,
  cta: `<div class="col" style="gap: 12px; align-items: flex-start">
          <a class="btn lg" href="#">Ver o exame</a>
          <p class="sub small">O link vale por uma hora e por um clique só.</p>
        </div>`,
  foot: "Você recebeu este e-mail porque alguém pediu um exame com este endereço no bugsniff. Se não foi você, pode ignorar: sem o clique, nada acontece.",
});

export const EmailConvite = email({
  preheader: "Marina convidou você para a Agência Caravela no bugsniff",
  title: "Você foi convidado para a Agência Caravela",
  body: `<p class="lede sub" style="text-wrap: pretty"><strong style="color: var(--foreground); font-weight: 500">marina@agenciacaravela.com.br</strong> convidou você a entrar na organização Agência Caravela, com acesso a 38 lojas, aos exames e aos documentos delas.</p>`,
  cta: `<div class="col" style="gap: 12px; align-items: flex-start">
          <a class="btn lg" href="#">Entrar na organização</a>
          <p class="sub small">O convite vale por 7 dias.</p>
        </div>`,
  foot: "Convite é o único caminho de entrada numa organização que você não criou. Se não conhece quem convidou, ignore este e-mail.",
});

export const EmailRelatorio = email({
  preheader: "A leitura de casadobolo.com.br mudou desde 24 de agosto",
  title: "A leitura desta loja mudou",
  body: `<p class="lede sub" style="text-wrap: pretty">No exame de hoje, <strong style="color: var(--foreground); font-weight: 500">casadobolo.com.br</strong> acionou um rastreador que não estava lá na semana passada.</p>
          <div class="col" style="gap: 8px; padding: 14px 16px; border-radius: 14px; background: color-mix(in oklab, var(--primary) 16%, transparent)">
            <span style="font-weight: 500">Criteo, antes do consentimento</span>
            <span class="sub small">Não aparecia no exame de 24 de agosto. Nenhum outro rastreador entrou ou saiu.</span>
          </div>`,
  cta: `<div class="col" style="gap: 12px; align-items: flex-start">
          <a class="btn lg" href="#">Ver o exame de hoje</a>
        </div>`,
  foot: "Você recebe este aviso porque o monitoramento semanal está ligado para esta loja. Dá para trocar a frequência ou desligar na tela de monitoramento.",
});
