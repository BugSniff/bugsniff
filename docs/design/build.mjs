// Gera os artboards do canvas a partir das peças e das telas.
//
//   node docs/design/build.mjs
//
// Escreve um .dc.html por tela em docs/design/ e o canvas.json com a
// disposição. Editar uma tela é editar _screens-*.mjs e rodar isto de novo.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as A from "./_screens-a.mjs";
import * as B from "./_screens-b.mjs";
import * as C from "./_screens-c.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "artboards");
mkdirSync(OUT, { recursive: true });

/** [arquivo, conteúdo, largura, altura, título no canvas] */
const PAGES = [
  {
    id: "page-1",
    name: "Entrada",
    boards: [
      ["Landing", A.Landing, 1440, 1580],
      ["Login", A.Login, 1440, 820],
      ["LinkEnviado", A.LinkEnviado, 1440, 820],
      ["LinkExpirado", A.LinkExpirado, 1440, 860],
    ],
  },
  {
    id: "page-2",
    name: "Exame",
    boards: [
      ["Main", A.ExameEmCards(), 1440, 2480, "Exame · nota em cards"],
      ["ExameLista", A.Exame(), 1440, 2160, "Exame · leituras"],
      ["Painel", A.Painel(), 1440, 1020],
      ["Exames", A.Exames, 1440, 780],
      ["ExameEsperando", A.ExameEsperando, 1440, 880],
      ["Achados", A.Achados, 1440, 1120],
      ["NovoExame", C.NovoExame, 1440, 900],
      ["PainelVazio", C.PainelVazio, 1440, 960],
      ["ExameNaFila", C.ExameNaFila, 1440, 1420],
      ["ExameNaoMedido", C.ExameNaoMedido, 1440, 1040],
    ],
  },
  {
    id: "page-3",
    name: "Relatórios",
    boards: [
      ["Relatorio", B.Relatorio(), 1440, 1000],
      ["RelatorioWhiteLabel", B.RelatorioWhiteLabel, 900, 1320],
      ["Monitoramento", B.Monitoramento, 1440, 940],
    ],
  },
  {
    id: "page-4",
    name: "Lojas",
    boards: [
      ["Lojas", B.Lojas, 1440, 640],
      ["Loja", B.Loja, 1440, 720],
      ["ConectarPlataforma", B.ConectarPlataforma, 1440, 660],
      ["ConectarAutorizacao", B.ConectarAutorizacao, 1440, 740],
    ],
  },
  {
    id: "page-5",
    name: "Documentos e banner",
    boards: [
      ["Documentos", B.Documentos, 1440, 900],
      ["VersaoDocumento", B.VersaoDocumento, 1440, 780],
      ["PublicarNaLoja", B.PublicarNaLoja, 1440, 780],
      ["BannerConfiguracao", B.BannerConfiguracao, 1440, 940],
      ["BannerBloqueio", B.BannerBloqueio, 1440, 800],
      ["BannerPrevia", B.BannerPrevia, 1000, 760],
    ],
  },
  {
    id: "page-6",
    name: "Jurídico e conta",
    boards: [
      ["RevisaoPedir", B.RevisaoPedir, 1440, 780],
      ["RevisaoParecer", B.RevisaoParecer, 1440, 880],
      ["Membros", B.Membros, 1440, 780],
      ["Plano", B.Plano, 1440, 920],
      ["Conta", B.Conta, 1440, 900],
      ["Estados", B.Estados, 1200, 880],
    ],
  },
  {
    id: "page-7",
    name: "E-mails",
    boards: [
      ["EmailMagicLink", B.EmailMagicLink, 900, 720],
      ["EmailConvite", B.EmailConvite, 900, 720],
      ["EmailRelatorio", B.EmailRelatorio, 900, 840],
    ],
  },
  {
    id: "page-8",
    name: "Escuro",
    boards: [
      ["PainelEscuro", A.Painel(true), 1440, 1020, "Painel · escuro"],
      [
        "ExameEscuro",
        A.ExameEmCards(true),
        1440,
        2480,
        "Exame · nota em cards, escuro",
      ],
      ["RelatorioEscuro", B.Relatorio(true), 1440, 1000, "Relatório · escuro"],
    ],
  },
  {
    // O caminho inteiro, na ordem em que a pessoa o vive — com os desvios que
    // ele tem de verdade: a caixa de entrada, a espera, e a loja que recusa.
    id: "page-9",
    name: "Fluxo completo",
    boards: [
      ["FluxoLogin", A.Login, 1440, 820, "1 · Entrar com o e-mail"],
      ["FluxoLinkEnviado", A.LinkEnviado, 1440, 820, "2 · Link enviado"],
      ["FluxoCaixa", C.CaixaDeEntrada, 1440, 620, "3 · O link chega"],
      [
        "FluxoPainelVazio",
        C.PainelVazio,
        1440,
        960,
        "4 · Cai logado, sem loja",
      ],
      ["FluxoNovoExame", C.NovoExame, 1440, 900, "5 · Cola o endereço"],
      ["FluxoFila", C.ExameNaFila, 1440, 1420, "6 · Na fila"],
      [
        "FluxoLendo",
        A.ExameEsperando,
        1440,
        880,
        "7 · Primeira leitura na tela",
      ],
      ["FluxoExame", A.ExameEmCards(), 1440, 2480, "8 · Exame pronto"],
      ["FluxoAchados", A.Achados, 1440, 1120, "9 · Achados"],
      ["FluxoRelatorio", B.Relatorio(), 1440, 1000, "10 · Relatório"],
      ["FluxoDocumentos", B.Documentos, 1440, 900, "11 · Documentos"],
      ["FluxoLojas", B.Lojas, 1440, 640, "12 · As lojas da pessoa"],
      ["FluxoNaoMedido", C.ExameNaoMedido, 1440, 1040, "Desvio · não medido"],
    ],
  },
];

const GAP_X = 140;
const GAP_Y = 180;
const PER_ROW = 3;

const artboards = [];
const files = [];

for (const page of PAGES) {
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  page.boards.forEach(([name, html, w, h, title], index) => {
    if (index > 0 && index % PER_ROW === 0) {
      x = 0;
      y += rowHeight + GAP_Y;
      rowHeight = 0;
    }

    const file = `${name}.dc.html`;
    writeFileSync(join(OUT, file), html);
    files.push(join("artboards", file));

    artboards.push({
      file,
      x,
      y,
      w,
      h,
      page: page.id,
      ...(title ? { title } : {}),
    });

    x += w + GAP_X;
    rowHeight = Math.max(rowHeight, h);
  });
}

const canvas = {
  artboards,
  pages: PAGES.map(({ id, name }) => ({ id, name })),
  annotations: [
    {
      id: "regra-da-cor",
      x: 0,
      y: -150,
      w: 520,
      page: "page-2",
      text: "Nenhuma cor significa conformidade.\n\nO âmbar marca o estado pré-consentimento e a ação; o vermelho só aparece em erro de sistema e ação destrutiva. A paleta não tem verde de propósito — semáforo numa auditoria conclui o que o texto se recusa a concluir.",
    },
    {
      id: "casca-dupla",
      x: 0,
      y: -150,
      w: 520,
      page: "page-1",
      text: "Duas cascas: o funil público é coluna centrada, sem sidebar. Quem clica no magic link cai logado, então o exame nasce dentro do app.",
    },
    {
      id: "fluxo-porta",
      x: 0,
      y: -190,
      w: 620,
      page: "page-9",
      text: "O caminho inteiro, na ordem em que a pessoa o vive.\n\nEntre pedir e ver existe um lugar que não é nosso: a caixa de entrada. O desenho tem que aguentar essa interrupção — por isso o passo 3 está aqui, e por isso o passo 4 assume que a pessoa chega já logada, sem loja nenhuma.",
    },
    {
      id: "fluxo-espera",
      x: 3160,
      y: -190,
      w: 480,
      page: "page-9",
      text: "A espera é dois passos, não um: a fila (6) e a primeira leitura já na tela (7). O que chega aos cinco segundos é resultado de verdade — falta só o momento de cada cookie.",
    },
    {
      id: "email-tecnico",
      x: 0,
      y: -170,
      w: 560,
      page: "page-7",
      text: "O magic link sai pelo Supabase Auth, com o Resend de SMTP. O template real é HTML de e-mail: tabela, estilo inline, cor em hex — oklch não sobrevive no Outlook. Convite e monitoramento precisam de envio próprio; o Supabase só manda os dele.",
    },
  ],
  launch: { view: "canvas", page: "page-9" },
};

writeFileSync(join(OUT, "canvas.json"), JSON.stringify(canvas, null, 2));

console.log(files.map((f) => `--artboard "${f}"`).join(" "));
console.error(`${artboards.length} artboards em ${OUT}`);
