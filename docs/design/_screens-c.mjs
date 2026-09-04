// As telas que faltavam, e os estados que o fluxo atravessa.
import { artboard, screen, icon, waiting, comingSkeleton } from "./_parts.mjs";

const S = { store: "casadobolo.com.br" };

/**
 * Examinar estando logado.
 *
 * A diferença para a home pública não é cosmética: aqui não há campo de
 * e-mail, porque a sessão já provou o que o magic link provaria, e o exame
 * começa no clique em vez de esperar a caixa de entrada.
 */
export const NovoExame = screen({
  active: "exames",
  store: S.store,
  crumbs: `<strong>Novo exame</strong>`,
  page: `      <div class="col" style="max-width: 640px; gap: 20px">
        <div class="col" style="gap: 6px">
          <h1>Examinar uma loja</h1>
          <p class="sub">O exame abre a loja num navegador de verdade, duas vezes: sem tocar em nada, e depois de aceitar o banner. Leva cerca de 20 segundos.</p>
        </div>

        <div class="card" style="gap: 16px">
          <div class="col" style="gap: 6px">
            <label class="label">Endereço da loja</label>
            <div class="field on">casadobolo.com.br</div>
            <p class="sub small">Sem http, sem barra no fim — só o endereço.</p>
          </div>

          <div class="col" style="gap: 8px">
            <label class="label">Guardar em</label>
            <div class="row" style="gap: 8px; flex-wrap: wrap">
              <span class="btn sm">Casa do Bolo</span>
              <span class="btn secondary sm">Ateliê da Flor</span>
              <span class="btn secondary sm">Vinhos da Serra</span>
              <span class="btn outline sm">${icon("plus", 14)} Loja nova</span>
            </div>
          </div>

          <div class="sep"></div>

          <div class="between">
            <span class="sub small">Você tem 588 exames disponíveis este mês</span>
            <a class="btn lg" href="#">Examinar agora</a>
          </div>
        </div>

        <div class="card sm" style="flex-direction: row; gap: 10px; align-items: flex-start">
          <span class="dim" style="margin-top: 2px">${icon("alert", 18)}</span>
          <p class="sub">Não precisa conectar a loja para examinar. A conexão serve para instalar o banner e trocar a página de política — o exame olha de fora, como qualquer visitante.</p>
        </div>
      </div>`,
});

/** O painel de quem acabou de entrar e ainda não tem nada. */
export const PainelVazio = screen({
  active: "painel",
  store: "nenhuma loja ainda",
  crumbs: `<strong>Painel</strong>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 4px">
          <h1>Bem-vinda ao bugsniff</h1>
          <p class="sub">Sua organização foi criada quando você clicou no link. Falta a primeira loja.</p>
        </div>
      </div>

      <div class="card" style="gap: 20px; align-items: center; text-align: center; padding: 56px 24px">
        <span class="brand-mark" style="width: 48px; height: 48px; border-radius: 16px">${icon("scan", 24)}</span>
        <div class="col" style="gap: 8px; align-items: center">
          <h2 style="font-size: 18px">Examine a primeira loja</h2>
          <p class="sub" style="max-width: 420px">Cole o endereço e o exame começa na hora. Não precisa conectar nada, instalar nada, nem falar com ninguém.</p>
        </div>
        <div class="row" style="gap: 8px; width: 440px">
          <div class="field" style="flex: 1">casadobolo.com.br</div>
          <a class="btn" href="#">Examinar</a>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="card sm" style="gap: 8px">
          <h3>Depois do primeiro exame</h3>
          <p class="sub small">Você vê o que a loja gravou antes de perguntar qualquer coisa, com o nome de cada serviço.</p>
        </div>
        <div class="card sm" style="gap: 8px">
          <h3>Documentos</h3>
          <p class="sub small">A política de privacidade sai da leitura da sua loja, citando os serviços que ela realmente usa.</p>
        </div>
        <div class="card sm" style="gap: 8px">
          <h3>Banner</h3>
          <p class="sub small">A lista de bloqueio nasce do exame: são os rastreadores encontrados nesta loja, não uma lista genérica.</p>
        </div>
      </div>`,
});

/** Acabou de entrar na fila: nada foi lido ainda. */
/**
 * A fila, que é a espera antes de a espera começar.
 *
 * A casca é a mesma da leitura em andamento — mesma peça, outro passo —, e
 * abaixo dela o esqueleto reserva a forma exata do resultado: o placar de
 * números e a grade de cards na altura em que eles chegam.
 */
export const ExameNaFila = screen({
  active: "exames",
  store: S.store,
  crumbs: `casadobolo.com.br <span>/</span> Exames <span>/</span> <strong>agora</strong>`,
  page: `${waiting({ at: 0, clock: "22 segundos", seconds: 22 })}

${comingSkeleton()}`,
});

/** A loja recusou o navegador: não é leitura limpa, é leitura que não houve. */
export const ExameNaoMedido = screen({
  active: "exames",
  store: "petshopdobairro.com.br",
  crumbs: `petshopdobairro.com.br <span>/</span> Exames <span>/</span> <strong>31 ago, 15h20</strong>`,
  actions: `<a class="btn outline sm" href="#">${icon("refresh", 14)} Tentar de novo</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">petshopdobairro.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag bad">${icon("alert", 12)} não medido</span>
            <span class="sub small">31 de agosto de 2026, 15h20</span>
          </div>
        </div>
      </div>

      <div class="card" style="gap: 12px">
        <p class="lede" style="text-wrap: pretty">A loja respondeu ao nosso navegador com uma página de erro, não com a loja. <strong>Não é um exame limpo: é um exame que não aconteceu.</strong></p>
        <p class="sub">Nenhum cookie desta leitura pertence à loja — eles são da página que veio no lugar dela. Por isso não há tabela aqui, nem achado nenhum.</p>
      </div>

      <div class="col" style="gap: 10px; max-width: 720px">
        <div class="between">
          <span style="font-weight: 500">A tela que nosso navegador recebeu</span>
          <span class="tag outline">no lugar da loja</span>
        </div>
        <div class="shot">
          <div class="shot-bar">
            <span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span>
            <span class="shot-url mono">petshopdobairro.com.br</span>
          </div>
          <div class="col" style="background: var(--card); padding: 48px 24px; gap: 12px; align-items: center; text-align: center">
            <span class="block" style="width: 64px; height: 64px; border-radius: 999px"></span>
            <span style="font-weight: 500">Não é possível acessar a página</span>
            <span class="sub small">Erro 403</span>
          </div>
        </div>
        <p class="sub small">Costuma ser bloqueio de robô: a loja recusa visitas que não vêm de um navegador comum. Tentar de novo às vezes resolve; quando não resolve, dá para examinar de dentro, conectando a loja.</p>
      </div>`,
});

/**
 * A caixa de entrada.
 *
 * Não é tela do produto, e é por isso que ela está no fluxo: entre pedir o
 * exame e ver o exame existe um lugar que não é nosso, e o desenho tem que
 * aguentar essa interrupção.
 */
export const CaixaDeEntrada = artboard({
  body: `  <div class="col" style="width: 100%; background: var(--muted); padding: 40px; align-items: center">
      <div class="col" style="max-width: 720px; width: 100%; gap: 16px">
        <p class="sub small">Fora do produto: é aqui que a pessoa decide voltar.</p>
        <div class="card flush">
          <div class="card-head">
            <div class="row" style="gap: 10px; align-items: center">
              <span class="brand-mark">${icon("scan", 15)}</span>
              <div class="col" style="gap: 1px">
                <span style="font-weight: 500">bugsniff</span>
                <span class="sub small mono">nao-responda@updates.bugsniff.com.br</span>
              </div>
            </div>
            <span class="sub small">agora</span>
          </div>
          <div class="col" style="padding: 20px 24px; gap: 14px">
            <span style="font-weight: 500; font-family: 'Noto Sans', sans-serif; font-size: 17px">Seu link para entrar</span>
            <p class="sub">Clique para ver o exame de casadobolo.com.br. O exame começa a rodar quando você clicar — nada sobe antes disso.</p>
            <a class="btn" href="#" style="align-self: flex-start">Ver o exame</a>
            <p class="sub small">O link vale por uma hora e por um clique só.</p>
          </div>
        </div>
      </div>
  </div>`,
});
