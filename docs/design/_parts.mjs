// Peças compartilhadas das telas do bugsniff.
//
// Os valores aqui NÃO foram inventados: saíram de `components/ui/*` depois do
// preset shadcn (style base-maia, base mauve, ícones Tabler). Botão, campo e
// badge são pílula (rounded-4xl = 26px); card tem anel, não borda; cabeçalho de
// tabela tem 48px e peso 500 em foreground. Se o código mudar, isto muda junto.
//
// A casca é idêntica em todas as telas, então mora aqui uma vez e é injetada na
// geração — em vez de existir trinta e cinco vezes copiada, onde uma correção
// viraria trinta e cinco correções.

/** O tema, copiado de `app/globals.css` depois do preset. */
export const TOKENS = `
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0.008 326);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0.008 326);
  --primary: oklch(0.852 0.199 91.936);
  --primary-foreground: oklch(0.421 0.095 57.708);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.96 0.003 325.6);
  --muted-foreground: oklch(0.542 0.034 322.5);
  --accent: oklch(0.96 0.003 325.6);
  --accent-foreground: oklch(0.212 0.019 322.12);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0.005 325.62);
  --input: oklch(0.922 0.005 325.62);
  --ring: oklch(0.711 0.019 323.02);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0.008 326);
  --sidebar-primary: oklch(0.681 0.162 75.834);
  --sidebar-primary-foreground: oklch(0.987 0.026 102.212);
  --sidebar-accent: oklch(0.96 0.003 325.6);
  --sidebar-accent-foreground: oklch(0.212 0.019 322.12);
  --sidebar-border: oklch(0.922 0.005 325.62);
}

.dark {
  --background: oklch(0.145 0.008 326);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.212 0.019 322.12);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.795 0.184 86.047);
  --primary-foreground: oklch(0.421 0.095 57.708);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.263 0.024 320.12);
  --muted-foreground: oklch(0.711 0.019 323.02);
  --accent: oklch(0.263 0.024 320.12);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.542 0.034 322.5);
  --sidebar: oklch(0.212 0.019 322.12);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.795 0.184 86.047);
  --sidebar-primary-foreground: oklch(0.987 0.026 102.212);
  --sidebar-accent: oklch(0.263 0.024 320.12);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
}
`;

/**
 * O vocabulário visual, traduzido dos componentes reais.
 *
 * Uma regra atravessa tudo: nenhuma cor significa conformidade. O âmbar marca
 * ação e destaca o estado pré-consentimento; `destructive` só aparece em erro
 * de sistema e ação destrutiva. A paleta não tem verde, e é melhor assim —
 * semáforo numa auditoria conclui o que o texto se recusa a concluir.
 */
export const BASE = `
* { box-sizing: border-box; }
body { margin: 0; }
.root {
  display: flex;
  min-height: 100%;
  background: var(--background);
  color: var(--foreground);
  font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .heading { font-family: "Noto Sans", ui-sans-serif, system-ui, sans-serif; }
a { color: var(--foreground); text-decoration: none; }
a:hover { color: var(--muted-foreground); }
.mono { font-family: "Geist Mono", ui-monospace, SFMono-Regular, monospace; }

/* sidebar — 16rem, bg-sidebar */
.side {
  width: 256px;
  flex-shrink: 0;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}
.brand { display: flex; align-items: center; gap: 8px; padding: 6px 8px; }
.brand-mark {
  width: 24px; height: 24px; border-radius: 8px;
  background: var(--primary); color: var(--primary-foreground);
  display: flex; align-items: center; justify-content: center;
}
.brand-name { font-family: "Noto Sans", sans-serif; font-weight: 600; letter-spacing: -0.01em; font-size: 15px; }
.switch {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border: 1px solid var(--border); border-radius: 26px;
  background: color-mix(in oklab, var(--input) 30%, transparent);
}
.switch-label { font-size: 11px; color: var(--muted-foreground); line-height: 1.2; }
.switch-name { font-size: 13px; font-weight: 500; line-height: 1.3; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-label {
  font-size: 11px; color: var(--muted-foreground);
  padding: 10px 10px 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  height: 32px; padding: 0 10px; border-radius: 26px;
  color: var(--sidebar-foreground); font-size: 14px;
}
.nav-item.on { background: var(--sidebar-accent); color: var(--sidebar-accent-foreground); font-weight: 500; }
.nav-item svg { color: var(--muted-foreground); }
.nav-item.on svg { color: var(--sidebar-primary); }
.nav-count { margin-left: auto; font-size: 12px; color: var(--muted-foreground); }
.side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 2px; }
.who {
  display: flex; align-items: center; gap: 8px;
  padding: 10px; margin-top: 8px;
  border-top: 1px solid var(--sidebar-border);
}
.who-avatar {
  width: 26px; height: 26px; border-radius: 999px; flex-shrink: 0;
  background: var(--accent); color: var(--accent-foreground);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
}
.who-mail { font-size: 12px; color: var(--muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* main */
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.top {
  height: 56px; flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; gap: 16px;
}
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted-foreground); }
.crumbs strong { color: var(--foreground); font-weight: 500; }
.page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
h2 { font-size: 16px; font-weight: 500; margin: 0; }
h3 { font-size: 13px; font-weight: 400; margin: 0; color: var(--muted-foreground); }
p { margin: 0; }
.sub { color: var(--muted-foreground); }
.lede { font-size: 15px; line-height: 1.6; }
.small { font-size: 12px; }

/* controls — h-9, rounded-4xl (26px), text-sm, font-medium */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 36px; padding: 0 12px; border-radius: 26px;
  font-size: 14px; font-weight: 500; border: 1px solid transparent;
  background: var(--primary); color: var(--primary-foreground);
  white-space: nowrap;
}
.btn.outline { background: color-mix(in oklab, var(--input) 30%, transparent); border-color: var(--border); color: var(--foreground); }
.btn.secondary { background: var(--secondary); color: var(--secondary-foreground); }
.btn.ghost { background: transparent; color: var(--foreground); }
.btn.danger { background: color-mix(in oklab, var(--destructive) 10%, transparent); color: var(--destructive); }
.btn.lg { height: 40px; padding: 0 16px; }
.btn.sm { height: 32px; padding: 0 12px; }
.btn.xs { height: 24px; padding: 0 10px; font-size: 12px; }
.field {
  height: 36px; border: 1px solid var(--input); border-radius: 26px;
  background: color-mix(in oklab, var(--input) 30%, transparent);
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; color: var(--muted-foreground); font-size: 14px;
}
.field.on { border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent); color: var(--foreground); }
.field.filled { color: var(--foreground); }
.field.tall { height: auto; border-radius: 18px; padding: 10px 14px; align-items: flex-start; }
.label { font-size: 14px; font-weight: 500; margin-bottom: 6px; display: block; }

/* surfaces — card: rounded-2xl (18px), ring-1 ring-foreground/10, no border */
.card {
  background: var(--card); color: var(--card-foreground);
  border-radius: 18px; padding: 24px;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent);
  display: flex; flex-direction: column; gap: 24px;
  overflow: hidden;
}
.card.sm { padding: 16px; gap: 16px; }
.card.flush { padding: 0; gap: 0; }
.card-head { padding: 20px 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.card-title { font-family: "Noto Sans", sans-serif; font-size: 16px; font-weight: 500; }
.card-desc { color: var(--muted-foreground); }
.grid { display: grid; gap: 16px; }
.row { display: flex; gap: 16px; }
.col { display: flex; flex-direction: column; }
.between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sep { height: 1px; background: var(--border); }

/* badge — h-5, rounded-4xl, text-xs, font-medium */
.tag {
  display: inline-flex; align-items: center; gap: 5px;
  height: 20px; padding: 0 8px; border-radius: 26px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
  background: var(--secondary); color: var(--secondary-foreground);
}
.tag.pre { background: var(--primary); color: var(--primary-foreground); }
.tag.outline { background: color-mix(in oklab, var(--input) 30%, transparent); border: 1px solid var(--border); color: var(--foreground); }
.tag.bad { background: color-mix(in oklab, var(--destructive) 10%, transparent); color: var(--destructive); }
.tag.lg { height: 24px; font-size: 13px; padding: 0 10px; }

/* tables — th h-12 px-3 font-medium foreground; td p-3; rows border-b */
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th {
  text-align: left; font-weight: 500; color: var(--foreground);
  height: 48px; padding: 0 12px; white-space: nowrap;
}
thead tr { border-bottom: 1px solid var(--border); }
td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
.dim { color: var(--muted-foreground); }
.num { font-variant-numeric: tabular-nums; }

/* o print da loja, como retângulo desenhado */
.shot { border-radius: 14px; overflow: hidden; background: var(--muted); box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent); }
.shot-bar { height: 28px; display: flex; align-items: center; gap: 5px; padding: 0 12px; background: var(--card); border-bottom: 1px solid var(--border); }
.shot-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--border); }
.shot-url { margin-left: 8px; font-size: 10px; color: var(--muted-foreground); }
.shot-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--card); }
.bar { height: 9px; border-radius: 4px; background: color-mix(in oklab, var(--muted-foreground) 20%, transparent); }
.block { border-radius: 8px; background: color-mix(in oklab, var(--muted-foreground) 12%, transparent); }
.shot-banner {
  border-radius: 12px; padding: 10px 12px; font-size: 11px;
  background: var(--background); box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 12%, transparent);
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.shot-pill { height: 18px; border-radius: 26px; background: var(--primary); width: 54px; }

/* nota — o número é o que a pessoa vai agir sobre, então ele é o maior
   elemento da página e do card. Nunca colorido pelo valor: nota alta não vira
   verde, nota baixa não vira vermelho (ADR-0005). O tamanho é o destaque. */
.board { display: flex; align-items: stretch; }
.board-cell { display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; padding: 0 36px; }
.board-cell:first-child { padding-left: 0; }
.board-cell + .board-cell { border-left: 1px solid var(--border); }
.board-label { font-size: 13px; color: var(--muted-foreground); }
.num-lg, .num-md, .pts, .tally {
  font-family: "Noto Sans", sans-serif; font-weight: 600;
  font-variant-numeric: tabular-nums; line-height: 1;
}
.num-lg { font-size: 76px; letter-spacing: -0.045em; }
.num-md { font-size: 40px; letter-spacing: -0.03em; }
.tally { font-size: 28px; letter-spacing: -0.03em; }
.pts { font-size: 36px; letter-spacing: -0.035em; }
.num-lg em, .num-md em, .pts em, .tally em {
  font-style: normal; font-weight: 400; color: var(--muted-foreground);
}
.num-lg em { font-size: 22px; }
.num-md em { font-size: 16px; }
.tally em { font-size: 15px; }
.pts em { font-size: 16px; }
.pts.none { font-size: 15px; font-weight: 400; color: var(--muted-foreground); }

/* um ponto da norma como card. Todos com a mesma altura: a nota de um ponto
   não pode parecer maior porque o trecho citado era mais comprido. Âmbar só
   onde faltou ponto, que é onde está a ação. */
/* --point-h é a altura combinada da seção: todo card da tela sai do mesmo
   tamanho, e o minmax deixa crescer se um trecho citado for maior que o
   previsto — em vez de cortar a evidência para caber. */
.points { display: grid; gap: 16px; grid-auto-rows: minmax(var(--point-h, 0px), 1fr); }
.point {
  height: 100%; display: flex; flex-direction: column; gap: 12px;
  background: var(--card); border-radius: 18px; padding: 18px 20px;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent);
}
.point.gap { box-shadow: inset 3px 0 0 0 var(--primary), 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent); }
.point.unmeasured { background: transparent; box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent); }
.point-mark { color: var(--muted-foreground); flex-shrink: 0; }
.point.gap .point-mark { color: var(--sidebar-primary); }
.point-label { font-weight: 500; letter-spacing: -0.005em; }
.norm { font-size: 12px; color: color-mix(in oklab, var(--muted-foreground) 75%, transparent); }

/* a evidência ocupa o que sobra, para a altura igual não virar buraco */
.evidence { margin: 0; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.evidence figcaption { font-size: 11px; color: var(--muted-foreground); }
.evidence blockquote {
  margin: 0; flex: 1; padding: 12px 14px; border-radius: 12px;
  background: var(--muted); color: var(--muted-foreground);
  font-size: 13px; line-height: 1.6;
}
.evidence blockquote mark {
  background: transparent; color: var(--foreground); font-weight: 500;
  text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;
}
.chips { display: flex; flex-wrap: wrap; gap: 5px; }

/* a barra é o tempo, não o progresso */
.timebar { height: 6px; border-radius: 26px; background: color-mix(in oklab, var(--foreground) 10%, transparent); overflow: hidden; }
.timebar span { display: block; height: 100%; border-radius: 26px; background: var(--primary); }
`;

/** Ícones no traço do Tabler: viewBox 24, stroke 2, pontas redondas. */
export const icon = (name, size = 16) => {
  const paths = {
    scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
    store:
      '<path d="M3 9h18l-1.2-4.2A1.5 1.5 0 0 0 18.4 4H5.6a1.5 1.5 0 0 0-1.4 1.1L3 9Z"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
    shield:
      '<path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z"/>',
    report: '<path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users:
      '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="3.2"/><path d="M17 4.3a3.2 3.2 0 0 1 0 6.2M21 20v-1.5a4 4 0 0 0-3-3.8"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5 13 6a6.4 6.4 0 0 1 2 .8l2.4-1 1.7 1.7-1 2.4a6.4 6.4 0 0 1 .8 2l2.5 1v2.4l-2.5 1a6.4 6.4 0 0 1-.8 2l1 2.4-1.7 1.7-2.4-1a6.4 6.4 0 0 1-2 .8l-1 2.5H10.6l-1-2.5a6.4 6.4 0 0 1-2-.8l-2.4 1-1.7-1.7 1-2.4a6.4 6.4 0 0 1-.8-2l-2.5-1V10.9l2.5-1a6.4 6.4 0 0 1 .8-2l-1-2.4L5.2 3.8l2.4 1a6.4 6.4 0 0 1 2-.8l1-2.5h2.4Z"/>',
    "circle-check":
      '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-4.5"/>',
    "circle-x":
      '<circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
    "circle-dashed":
      '<circle cx="12" cy="12" r="9" stroke-dasharray="2.4 3.1"/>',
    "circle-check":
      '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-4.5"/>',
    "circle-x":
      '<circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
    "circle-dashed":
      '<circle cx="12" cy="12" r="9" stroke-dasharray="2.4 3.1"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 5 5L20 6"/>',
    alert: '<path d="M12 8v5M12 16.2v.3"/><circle cx="12" cy="12" r="9"/>',
    camera:
      '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.4"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7.5 9 6 9-6"/>',
    external:
      '<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    scale:
      '<path d="M12 4v16M7 8h10M5 20h14"/><path d="m7 8-3 6h6L7 8ZM17 8l-3 6h6l-3-6Z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    refresh:
      '<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 13a8 8 0 0 0 14 4.5L20 15"/><path d="M4 5v4h4M20 19v-4h-4"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

const NAV_STORE = [
  ["exames", "Exames", "scan", "12"],
  ["documentos", "Documentos", "doc", ""],
  ["banner", "Banner", "shield", ""],
  ["relatorios", "Relatórios", "report", ""],
  ["monitoramento", "Monitoramento", "clock", ""],
];

const NAV_ORG = [
  ["lojas", "Lojas", "store", "38"],
  ["membros", "Membros", "users", ""],
  ["plano", "Plano", "card", ""],
  ["conta", "Conta", "gear", ""],
];

const navItem =
  (active) =>
  ([key, label, ic, count]) =>
    `      <a class="nav-item${active === key ? " on" : ""}" href="#">${icon(ic)}<span>${label}</span>${count ? `<span class="nav-count num">${count}</span>` : ""}</a>\n`;

/**
 * A sidebar: seletor de loja no topo, seções daquela loja abaixo, e o que é da
 * organização separado no rodapé. Quem tem uma loja nunca toca no seletor; quem
 * tem trinta e oito troca de contexto o dia inteiro.
 */
export const sidebar = (
  active,
  store = "casadobolo.com.br"
) => `  <nav class="side">
    <div class="brand">
      <span class="brand-mark">${icon("scan", 15)}</span>
      <span class="brand-name">bugsniff</span>
    </div>

    <a class="nav-item${active === "painel" ? " on" : ""}" href="#">${icon("report")}<span>Painel</span></a>

    <div class="switch">
      <span class="brand-mark" style="background: var(--accent); color: var(--accent-foreground); width: 22px; height: 22px; border-radius: 7px">${icon("store", 13)}</span>
      <span class="col" style="min-width: 0">
        <span class="switch-label">Loja</span>
        <span class="switch-name">${store}</span>
      </span>
      <span style="margin-left: auto; color: var(--muted-foreground)">${icon("down", 15)}</span>
    </div>

    <div class="nav">
${NAV_STORE.map(navItem(active)).join("")}    </div>

    <div class="side-foot">
      <div class="nav-label">Organização</div>
${NAV_ORG.map(navItem(active)).join("")}      <div class="who">
        <span class="who-avatar">MC</span>
        <span class="who-mail">marina@agenciacaravela.com.br</span>
      </div>
    </div>
  </nav>`;

export const top = (crumbs, actions = "") => `    <header class="top">
      <div class="crumbs">${crumbs}</div>
      <div class="row" style="gap: 8px; align-items: center">${actions}</div>
    </header>`;

/** Um arquivo de artboard, pronto para o canvas. */
export const artboard = ({ body, dark = false, extra = "" }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&family=Noto+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
  <style>${TOKENS}${BASE}${extra}</style>
</helmet>
<div class="root${dark ? " dark" : ""}">
${body}
</div>
</x-dc>
</body>
</html>
`;

/** Uma tela do app: sidebar, topo e conteúdo. */
export const screen = ({
  active,
  crumbs,
  actions = "",
  page,
  store,
  dark = false,
  extra = "",
}) =>
  artboard({
    dark,
    extra,
    body: `${sidebar(active, store)}
  <div class="main">
${top(crumbs, actions)}
    <div class="page">
${page}
    </div>
  </div>`,
  });

/**
 * A espera, do jeito que o componente a monta.
 *
 * Mora aqui e não numa tela porque são dois estados da mesma casca — a fila e
 * a leitura em andamento —, e foi exatamente por estarem copiados em dois
 * arquivos que um ganhou a barra do tempo e o outro ficou meses para trás.
 *
 * `at` é o passo corrente: 0 fila, 1 antes do consentimento, 2 depois dele.
 */
const STEPS = [
  {
    label: "Fila",
    title: "Na fila",
    detail: "Esperando uma vaga para abrir o navegador.",
  },
  {
    label: "Antes do consentimento",
    title: "Lendo a loja antes de qualquer interação",
    detail:
      "Abrindo a loja num navegador de verdade e registrando o que ela grava sem perguntar nada.",
  },
  {
    label: "Depois do consentimento, e a política",
    title: "Respondendo ao banner e procurando a política",
    detail:
      "Aceitando o banner para ver o que muda depois, e localizando a política de privacidade publicada.",
  },
];

/** O teto do exame, que é onde a barra do tempo termina. */
const CEILING = 180;

const mark = (done, doing) =>
  done
    ? `<span style="color: var(--muted-foreground); display: flex">${icon("check", 15)}</span>`
    : `<span style="display: flex; width: 15px; justify-content: center; color: ${doing ? "var(--sidebar-primary)" : "color-mix(in oklab, var(--muted-foreground) 40%, transparent)"}"><span style="border-radius: 999px; ${doing ? "width: 8px; height: 8px; background: currentColor" : "width: 6px; height: 6px; border: 1px solid currentColor"}"></span></span>`;

export const waiting = ({ at, clock, seconds }) => {
  const slow = seconds > 75;

  return `      <div class="page-head">
        <div class="col" style="gap: 6px">
          <h1 class="mono" style="font-size: 20px">casadobolo.com.br</h1>
          <div class="row" style="gap: 8px; align-items: center">
            ${
              at === 0
                ? `<span class="tag outline">na fila</span>
            <span class="sub small">pedido há ${clock}</span>`
                : `<span class="tag"><span style="width: 6px; height: 6px; border-radius: 999px; background: currentColor"></span> lendo</span>
            <span class="sub small">começou há ${clock}</span>`
            }
          </div>
        </div>
      </div>

      <div class="card" style="gap: 20px; background: color-mix(in oklab, var(--primary) 10%, var(--card))">
        <div class="row" style="gap: 12px; align-items: flex-start">
          <span style="color: var(--sidebar-primary); margin-top: 2px; display: flex">${icon("scan", 18)}</span>
          <div class="col" style="gap: 4px">
            <span style="font-weight: 500">${STEPS[at].title}</span>
            <p class="sub" style="max-width: 560px">${STEPS[at].detail} Esta página se atualiza sozinha — pode fechar e voltar depois.</p>
          </div>
        </div>

        <div class="col" style="gap: 10px">
${STEPS.map(
  (step, index) =>
    `          <span class="row" style="gap: 10px; align-items: center; ${index === at ? "font-weight: 500" : index < at ? "color: var(--muted-foreground)" : "color: color-mix(in oklab, var(--muted-foreground) 70%, transparent)"}">${mark(index < at, index === at)}<span>${step.label}</span></span>`
).join("\n")}
        </div>

        <div class="col" style="gap: 6px">
          <div class="timebar"><span style="width: ${Math.round((seconds / CEILING) * 100)}%"></span></div>
          <div class="between">
            <span class="sub small num">${clock} decorridos</span>
            <span class="sub small">para sozinho em 3min</span>
          </div>
        </div>

        <p class="sub small" style="max-width: 560px">${
          at === 0
            ? "Começa assim que uma vaga abrir. Cada exame na frente leva de 30 segundos a dois minutos."
            : slow
              ? "Esta loja está levando mais que a média — costuma acontecer com loja pesada, que continua carregando por um minuto ou mais. O exame segue."
              : "A barra é o tempo, não o progresso: ela anda com o relógio até o teto acima, porque quanto falta é justamente o que não sabemos. Costuma terminar em menos de um minuto."
        }</p>
      </div>`;
};

/**
 * O lugar do resultado, na forma exata em que ele chega.
 *
 * Não é enfeite: a página salta de uma linha de texto para um relatório
 * inteiro, e reservar a forma é o que impede a chegada de empurrar o que a
 * pessoa estava lendo para fora da tela. Por isso a forma tem que ser a de
 * verdade — o placar de números e a grade de cards na altura em que eles vêm.
 */
export const comingSkeleton = () => `      <div class="card">
        <div class="row" style="gap: 36px">
          <div class="block" style="width: 160px; height: 76px"></div>
          <div class="block" style="width: 96px; height: 76px"></div>
          <div class="block" style="width: 96px; height: 76px"></div>
        </div>
        <div class="col" style="gap: 10px">
          <div class="bar" style="max-width: 448px"></div>
          <div class="bar" style="max-width: 384px"></div>
        </div>
      </div>

      <div class="points" style="grid-template-columns: repeat(2, minmax(0, 1fr)); --point-h: 320px">
${[0, 1, 2, 3]
  .map(
    () => `        <div class="point">
          <div class="block" style="width: 80px; height: 36px"></div>
          <div class="bar" style="max-width: 260px; height: 14px"></div>
          <div class="block" style="flex: 1"></div>
          <div class="bar" style="width: 112px"></div>
        </div>`
  )
  .join("\n")}
      </div>`;
