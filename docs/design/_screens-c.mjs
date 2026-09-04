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

/**
 * De quem é a falha, que é o que decide a cor.
 *
 * Três donos, e não é taxonomia por gosto: cada um leva a um próximo passo
 * diferente, e hoje os onze motivos saem todos iguais, em vermelho, sem dizer
 * a quem pertencem. Endereço quem conserta é quem digitou. Loja é fato sobre
 * ela, e fato não é alarme. Nós é erro de sistema, e é o único lugar onde o
 * vermelho é o que o ADR-0005 diz que ele é.
 *
 * A tela de hoje pinta os três de vermelho, o que faz a paleta mentir em dois
 * terços dos casos — e o mais comum deles, a loja que barra o robô, é
 * justamente o que menos é erro nosso.
 */
const OWNER = {
  endereco: { label: "o endereço", tag: "pre", hint: "quem digitou conserta" },
  loja: {
    label: "a loja",
    tag: "outline",
    hint: "fato sobre ela, não erro nosso",
  },
  nos: {
    label: "nós",
    tag: "bad",
    hint: "falha nossa, e só aqui cabe vermelho",
  },
};

/** Uma linha do catálogo: o motivo, a frase que a pessoa lê, e o que fazer. */
const stateRow = ({
  key,
  title,
  sentence,
  next,
}) => `        <div class="col" style="gap: 6px; padding: 14px 0; border-top: 1px solid var(--border)">
          <div class="between" style="gap: 12px; align-items: baseline">
            <span style="font-weight: 500">${title}</span>
            <code class="mono sub" style="font-size: 11px">${key}</code>
          </div>
          <p class="sub small" style="text-wrap: pretty">${sentence}</p>
          <p class="small" style="color: var(--foreground); text-wrap: pretty"><span class="dim">→</span> ${next}</p>
        </div>`;

const stateColumn = (owner, rows) => {
  const o = OWNER[owner];
  return `      <div class="card" style="gap: 2px; align-content: start">
        <div class="col" style="gap: 8px; padding-bottom: 10px">
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag ${o.tag}">${o.label}</span>
            <span class="sub small">${o.hint}</span>
          </div>
        </div>
${rows.map(stateRow).join("\n")}
      </div>`;
};

/**
 * O catálogo dos onze motivos, agrupados por dono.
 *
 * Existe porque hoje eles só existem como um `Record<string, string>` em
 * `lib/exams.ts` — onze frases numa lista, sem ninguém nunca as ter visto
 * lado a lado. Vistas assim, duas coisas saltam: metade não diz o que fazer
 * em seguida, e todas saem com a mesma cara.
 */
export const EstadosDoExame = artboard({
  body: `  <div class="col" style="width: 100%; padding: 36px; gap: 22px; background: var(--background)">
    <div class="col" style="gap: 6px; max-width: 720px">
      <h1>Quando a leitura não acontece</h1>
      <p class="sub" style="text-wrap: pretty">Onze motivos, e a tela de hoje trata os onze igual: uma frase vermelha e um print. Agrupados por dono, eles pedem três telas diferentes — porque pedem três próximos passos diferentes.</p>
    </div>

    <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: start">
${stateColumn("endereco", [
  {
    key: "malformed",
    title: "Esse endereço não pôde ser lido",
    sentence: "O que foi digitado não forma um endereço.",
    next: "O campo volta preenchido com o que foi digitado, para corrigir sem redigitar.",
  },
  {
    key: "unsupported-scheme",
    title: "Só examinamos http e https",
    sentence: "O endereço começa com outra coisa.",
    next: "Trocar o começo. O campo já mostra o que sobra do endereço.",
  },
  {
    key: "unsupported-port",
    title: "Só examinamos as portas padrão",
    sentence:
      "Loja fica na porta padrão. Outra porta é quase sempre engano de quem colou.",
    next: "Tirar a porta do fim do endereço.",
  },
  {
    key: "unresolvable",
    title: "Não encontramos esse endereço",
    sentence: "Nenhum servidor de nomes respondeu por ele.",
    next: "Conferir a grafia. Domínio recém-criado às vezes leva horas para responder.",
  },
  {
    key: "private-address",
    title: "Esse endereço não é público",
    sentence:
      "Ele aponta para uma rede interna. Nosso navegador só abre o que qualquer visitante abriria.",
    next: "Nada — é limite nosso, de propósito. A loja precisa estar no ar para ser medida como o visitante a vê.",
  },
])}

${stateColumn("loja", [
  {
    key: "unreachable",
    title: "A loja não respondeu",
    sentence:
      "Ninguém atendeu dentro do tempo do exame. Pode estar fora do ar.",
    next: "Tentar de novo mais tarde. O monitoramento tenta sozinho na semana que vem.",
  },
  {
    key: "blocked",
    title: "A loja recusou o nosso navegador",
    sentence:
      "Veio uma página de erro no lugar da loja. Não é exame limpo: é exame que não aconteceu.",
    next: "Falar com quem cuida do site — é o WAF dele barrando, e liberar é uma regra. O print é a prova de que fomos barrados.",
  },
  {
    key: "unfinished",
    title: "A loja não terminou de carregar",
    sentence:
      "Ela respondeu, e ainda carregava quando paramos de olhar. Não vimos nada.",
    next: "Tentar de novo. Loja pesada às vezes termina na segunda.",
  },
])}

${stateColumn("nos", [
  {
    key: "abandoned",
    title: "O exame foi interrompido",
    sentence:
      "Ele começou e a execução morreu antes de terminar. Tentamos três vezes.",
    next: "Nada do seu lado. Pedir de novo custa um exame e costuma passar.",
  },
  {
    key: "browser-unavailable",
    title: "Nosso navegador não subiu",
    sentence:
      "A loja nunca chegou a ser aberta, então não há nada a dizer sobre ela.",
    next: "Nada do seu lado. Este exame não conta na sua cota.",
  },
  {
    key: "— sem motivo —",
    title: "O exame não pôde ser concluído",
    sentence:
      "A frase de fallback, para um motivo que ainda não sabemos nomear.",
    next: "Se aparecer, é bug nosso: significa que gravamos um motivo sem redação.",
  },
])}
    </div>

    <div class="card sm" style="flex-direction: row; gap: 10px; align-items: flex-start; max-width: 980px">
      <span class="dim" style="margin-top: 2px">${icon("alert", 18)}</span>
      <div class="col" style="gap: 6px">
        <p class="sub" style="text-wrap: pretty"><strong style="color: var(--foreground); font-weight: 500">A cor segue o dono, não a gravidade.</strong> Âmbar onde há ação de quem lê, nenhum realce onde é fato sobre a loja, vermelho só no que é erro nosso — que é o que o ADR-0005 já diz e esta tela ainda não fazia.</p>
        <p class="sub small" style="text-wrap: pretty">Fora daqui ficam dois estados que não são falha: <strong style="color: var(--foreground); font-weight: 500">na fila</strong> e <strong style="color: var(--foreground); font-weight: 500">lendo</strong>, que têm tela própria. E o <strong style="color: var(--foreground); font-weight: 500">não medido</strong> de uma dimensão — o banner que não soubemos responder — que é um ponto fora da conta, não um exame que falhou.</p>
      </div>
    </div>
  </div>`,
});

/**
 * A loja que barra o robô, no tamanho de tela cheia.
 *
 * É o estado que mais acontece dos onze, e o que mais precisa de próximo
 * passo: quem recebe um `blocked` não tem o que consertar sozinho, mas tem
 * exatamente uma pessoa para procurar — quem cuida do site.
 *
 * Quatro mudanças sobre o que está no ar hoje. O vermelho sai, porque a loja
 * ter um WAF não é erro de sistema nosso. O próximo passo entra, porque hoje
 * a tela termina no diagnóstico. O print encolhe para um tamanho que cabe na
 * página — hoje ele ocupa a tela inteira, com a mensagem de erro num canto e
 * novecentos pixels de branco embaixo. E a loja não perde o histórico: uma
 * leitura que não aconteceu não apaga a última que aconteceu.
 */
export const ExameNaoMedido = screen({
  active: "exames",
  store: "petshopdobairro.com.br",
  crumbs: `petshopdobairro.com.br <span>/</span> Exames <span>/</span> <strong>31 ago, 15h20</strong>`,
  actions: `<a class="btn outline sm" href="#">${icon("refresh", 14)} Examinar de novo</a>`,
  page: `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">petshopdobairro.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            <span class="tag">exame não aconteceu</span>
            <span class="sub small">31 de agosto de 2026, 15h20</span>
          </div>
        </div>
      </div>

      <div class="col" style="gap: 20px; max-width: 860px">
        <div class="card" style="gap: 14px">
          <div class="row" style="gap: 12px; align-items: flex-start">
            <span class="dim" style="margin-top: 3px">${icon("shield", 20)}</span>
            <div class="col" style="gap: 8px">
              <div class="row" style="gap: 8px; align-items: center; flex-wrap: wrap">
                <h2 style="font-size: 17px">A loja recusou o nosso navegador</h2>
                <span class="tag outline">fato sobre a loja</span>
              </div>
              <p class="lede" style="text-wrap: pretty">Veio uma página de erro no lugar da loja. <strong>Não é um exame limpo: é um exame que não aconteceu.</strong></p>
              <p class="sub" style="text-wrap: pretty">Nenhum cookie desta leitura pertence à loja — são da página que veio no lugar dela. Por isso não há nota aqui, nem tabela, nem achado: dizer "nenhum rastreador antes do consentimento" sobre uma tela que não é a loja seria o jeito mais lisonjeiro possível de estar errado.</p>
            </div>
          </div>
        </div>

        <div class="card" style="gap: 0">
          <div class="col" style="gap: 4px; padding-bottom: 12px">
            <h3>O que dá para fazer</h3>
            <p class="sub small">Em ordem de quem resolve mais rápido.</p>
          </div>
${[
  [
    "Examinar de novo",
    "Bloqueio de robô costuma ser intermitente: a mesma loja responde em uma tentativa e barra na seguinte.",
    `<a class="btn sm" href="#">${icon("refresh", 14)} Examinar de novo</a>`,
  ],
  [
    "Falar com quem cuida do site",
    "Quem barrou não foi a loja, foi o CDN ou o firewall na frente dela. Liberar o nosso navegador é uma linha de regra, e o print abaixo é o que essa pessoa precisa ver.",
    `<a class="btn outline sm" href="#">${icon("mail", 14)} Enviar o print por e-mail</a>`,
  ],
  [
    "Examinar de dentro",
    "Conectando a loja, o exame deixa de depender de entrar pela porta da frente. Vale a pena quando a loja barra sempre.",
    `<a class="btn outline sm" href="#">${icon("store", 14)} Conectar a loja</a>`,
  ],
]
  .map(
    (
      [title, detail, cta],
      i
    ) => `          <div class="row" style="gap: 12px; align-items: flex-start; padding: 14px 0; border-top: 1px solid var(--border)">
            <span class="num" style="margin-top: 1px">${i + 1}</span>
            <div class="col" style="gap: 8px; flex: 1">
              <span style="font-weight: 500">${title}</span>
              <p class="sub small" style="text-wrap: pretty">${detail}</p>
              <div>${cta}</div>
            </div>
          </div>`
  )
  .join("\n")}
        </div>

        <div class="col" style="gap: 10px">
          <div class="between">
            <span style="font-weight: 500">A tela que o nosso navegador recebeu</span>
            <span class="tag outline">no lugar da loja</span>
          </div>
          <div class="row" style="gap: 16px; align-items: flex-start">
            <div class="shot" style="width: 420px; flex: none">
              <div class="shot-bar">
                <span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span>
                <span class="shot-url mono">petshopdobairro.com.br</span>
              </div>
              <div class="col" style="background: var(--card); padding: 22px 20px; gap: 8px; height: 190px">
                <span style="font-weight: 600; font-size: 15px">Access Denied</span>
                <span class="sub small">You don't have permission to access "http://petshopdobairro.com.br/" on this server.</span>
                <span class="sub small mono" style="font-size: 10px">Reference #18.e5ab3717.1788542414.54ee3cb6</span>
              </div>
            </div>
            <div class="col" style="gap: 8px; flex: 1">
              <p class="sub small" style="text-wrap: pretty">O print em tamanho de miniatura, e não ocupando a página: ele é prova, não conteúdo. Clicar abre inteiro.</p>
              <p class="sub small" style="text-wrap: pretty">É ele que separa <strong style="color: var(--foreground); font-weight: 500">fomos barrados</strong> de <strong style="color: var(--foreground); font-weight: 500">não havia nada para achar</strong> — duas coisas que, sem a imagem, ficam com a mesma cara na tela.</p>
              <div><a class="btn ghost sm" href="#">${icon("eye", 14)} Ver inteiro</a></div>
            </div>
          </div>
        </div>

        <div class="card sm" style="flex-direction: row; gap: 12px; align-items: center; justify-content: space-between">
          <div class="col" style="gap: 3px">
            <span style="font-weight: 500">Esta loja tem 5 leituras, e 4 aconteceram</span>
            <span class="sub small">A última que aconteceu foi em 24 de agosto, com 78 de 100. Uma leitura que não aconteceu não apaga a que aconteceu.</span>
          </div>
          <a class="btn outline sm" href="#" style="flex: none">Ver a de 24 de agosto</a>
        </div>
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
