import type { Report } from "@/lib/report";

/**
 * The report as a printed page.
 *
 * Styled with a plain stylesheet and plain class names rather than with the
 * design system's utilities, because this exact markup is also what Chromium
 * is handed to print: the PDF route renders this component to a string, with
 * no bundler and no Tailwind anywhere near it. One component, two outputs —
 * the preview on screen and the file that gets e-mailed to a lawyer are the
 * same document, and cannot drift.
 *
 * Colours are hex, not the oklch tokens. A print engine is not the app, and a
 * PDF that renders differently from the preview is worse than one that does
 * not follow the palette exactly.
 */

const PAPER_CSS = `
.paper { width: 794px; margin: 0 auto; padding: 56px; box-sizing: border-box;
  background: #fff; color: #171417; font-size: 14px; line-height: 1.55;
  font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif; }
.paper h1, .paper h2 { font-family: "Noto Sans", ui-sans-serif, system-ui, sans-serif; margin: 0; }
.paper h1 { font-size: 28px; letter-spacing: -0.02em; line-height: 1.15; }
.paper h2 { font-size: 16px; font-weight: 500; }
.paper p { margin: 0; }
.paper .row { display: flex; gap: 12px; }
.paper .col { display: flex; flex-direction: column; }
.paper .between { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.paper .sub { color: #6b5f68; }
.paper .small { font-size: 12px; }
.paper .lede { font-size: 15px; }
.paper .mono { font-family: "Geist Mono", ui-monospace, SFMono-Regular, monospace; font-size: 13px; }
.paper .sep { height: 1px; background: #e7e2e6; }
.paper .stat { flex: 1; display: flex; flex-direction: column; gap: 2px;
  padding: 14px; border-radius: 12px; background: #f4f1f4; }
.paper .stat.marked { background: #fbe6a2; }
.paper .stat .num { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums;
  font-family: "Noto Sans", ui-sans-serif, system-ui, sans-serif; }
.paper blockquote { margin: 0; padding: 14px 18px; border-radius: 12px;
  background: #f4f1f4; color: #4a414a; }
.paper .finding { display: flex; flex-direction: column; gap: 10px; page-break-inside: avoid; }
.paper .shot { border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px #e7e2e6; }
.paper .shot img { display: block; width: 100%; }
.paper .stack { display: flex; flex-direction: column; gap: 28px; }
.paper .score { display: flex; align-items: baseline; gap: 8px; }
.paper .score .num { font-size: 44px; font-weight: 600; line-height: 1;
  font-family: "Noto Sans", ui-sans-serif, system-ui, sans-serif; font-variant-numeric: tabular-nums; }
.paper .dims { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.paper .dims li { display: flex; justify-content: space-between; gap: 16px;
  padding-bottom: 8px; border-bottom: 1px solid #f0ecef; }
.paper .dims li:last-child { border-bottom: 0; }
.paper .dims .pts { font-variant-numeric: tabular-nums; white-space: nowrap; color: #6b5f68; }
@page { size: A4; margin: 0; }
`;

const DAY = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIME = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function ReportPaper({
  report,
  banner,
}: {
  report: Report;
  /** The store's own screen at the first reading, when there is one. */
  banner?: string | null;
}) {
  const { store, at, counts, summary, disclosure, findings, score } = report;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAPER_CSS }} />

      <article className="paper">
        <div className="stack">
          <div className="between">
            <div className="col" style={{ gap: 2 }}>
              <span
                style={{
                  fontFamily: '"Noto Sans", sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                bugsniff
              </span>
              <span className="sub small">Relatório de leitura</span>
            </div>
            <div className="col small" style={{ textAlign: "right", gap: 2 }}>
              <span className="mono">{store}</span>
              <span className="sub">
                {DAY.format(at)}, {TIME.format(at)}
              </span>
            </div>
          </div>

          <div className="sep" />

          <div className="col" style={{ gap: 12 }}>
            <h1>O que esta loja faz, e o que ela declara</h1>
            {/*
              The sentence the whole product rests on, and the one the ADR-0001
              validator cannot enforce because it is ours, not the model's. It
              says what this document is *not* before it says anything it is.
            */}
            <p className="lede sub">
              Este documento relata fatos observados por um navegador real em{" "}
              {DAY.format(at)}, ao lado das normas que tratam de cada um. Não
              constitui parecer jurídico nem avaliação da situação legal da
              loja.
            </p>
          </div>

          <div className="row">
            <div className="stat">
              <span className="num">{counts.cookies}</span>
              <span className="sub small">cookies antes do consentimento</span>
            </div>
            <div className="stat">
              <span className="num">{counts.thirdParties}</span>
              <span className="sub small">terceiros contactados antes</span>
            </div>
            <div className="stat marked">
              <span className="num">{counts.trackers}</span>
              <span className="small">rastreadores nomeados</span>
            </div>
          </div>

          <div className="col" style={{ gap: 12 }}>
            <h2>Pontuação desta leitura</h2>
            {score.value === null ? (
              <p className="lede">
                Sem nota nesta leitura. Metade da pontuação é a distância entre
                o que a loja faz e o que ela declara, e nosso navegador não
                chegou à política desta loja — com {score.measured} dos 100
                pontos medidos, um número aqui diria mais do que sabemos.
              </p>
            ) : (
              <div className="score">
                <span className="num">{score.value}</span>
                <span className="sub">/ 100</span>
              </div>
            )}
            {/* The sentence that separates this number from a legal opinion.
                It travels with the number, at every size (ADR-0006). */}
            <p className="sub small">
              Pontuação técnica composta pelo bugsniff a partir do que o
              navegador observou, com peso definido por nós e não pela lei. Não
              constitui parecer jurídico nem avaliação da situação legal da
              loja.
              {score.value !== null && score.measured < 100
                ? ` Nesta leitura foi possível medir ${score.measured} dos 100 pontos.`
                : ""}
            </p>
            <ul className="dims">
              {score.dimensions.map((dimension) => (
                <li key={dimension.key}>
                  <span className="col" style={{ gap: 2 }}>
                    <span>{dimension.label}</span>
                    <span className="sub small">{dimension.norm}</span>
                  </span>
                  <span className="pts small">
                    {dimension.earned === null
                      ? "não medido"
                      : `${dimension.earned} / ${dimension.weight}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col" style={{ gap: 10 }}>
            <h2>Resumo da leitura</h2>
            <p className="lede">{summary}</p>
            {disclosure && <p className="lede sub">{disclosure}</p>}
          </div>

          {findings.map((finding, index) => (
            <div key={index} className="finding">
              <h2>Achado {index + 1}</h2>
              <p>
                <strong style={{ fontWeight: 500 }}>Fato observado.</strong>{" "}
                {finding.observedFact}
              </p>
              <p className="sub small">{finding.evidence}</p>
              <p>
                <strong style={{ fontWeight: 500 }}>Norma citada.</strong>{" "}
                {finding.normCitation}:
              </p>
              <blockquote>“{finding.normExcerpt}”</blockquote>
            </div>
          ))}

          {banner && (
            <div className="col" style={{ gap: 10 }}>
              <h2>A loja no momento da leitura</h2>
              <div className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner}
                  alt={`A tela de ${store} na leitura anterior ao consentimento`}
                />
              </div>
              <p className="sub small">
                A imagem mostra a tela que o visitante via enquanto os{" "}
                {counts.cookies} cookies acima já estavam gravados. Ela não
                mostra os cookies: cookie é invisível.
              </p>
            </div>
          )}

          <div className="sep" />

          <p className="sub small">
            bugsniff · leitura de {DAY.format(at)} às {TIME.format(at)} ·{" "}
            {store}
          </p>
        </div>
      </article>
    </>
  );
}
