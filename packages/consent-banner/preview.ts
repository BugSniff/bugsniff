/**
 * A stand-in storefront, so the banner can be looked at before it is installed.
 *
 * The preview runs the generated code itself rather than drawing a picture of
 * it. A second implementation of the banner for our own screen would drift from
 * the real one, and it would drift silently — the person would be approving
 * wording and colours on a mock and installing something else.
 *
 * There is not a single tracker on this page, and there never may be. Firing
 * the shop's real pixels to demonstrate that we block them would send the
 * merchant's own visit to Meta from inside our product, which is the exact
 * thing we write findings about.
 */

/** Grey furniture, so the banner has something to sit in front of. */
const block = (style: string) =>
  `<div style="background:#e7e5e4;border-radius:8px;${style}"></div>`;

/**
 * The page, with the snippet in the head where it is meant to go.
 *
 * Meant for a sandboxed frame, which is also why the banner always shows here:
 * cookies throw in an opaque origin, so the runtime finds no stored answer and
 * asks. A preview that remembered last week's click would be a preview of
 * nothing.
 */
export function previewPage(snippet: string, host: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prévia</title>
${snippet}
<style>
  body { margin: 0; font: 13px system-ui, sans-serif; background: #fff; color: #18181b }
  .bar { display: flex; gap: 8px; align-items: center; padding: 12px 16px;
         border-bottom: 1px solid #e7e5e4 }
  .page { display: flex; flex-direction: column; gap: 14px; padding: 16px;
          padding-bottom: 180px }
  .row { display: flex; gap: 12px }
  .row > * { flex: 1 }
</style>
</head>
<body>
  <div class="bar">
    <strong style="font-size:12px">${host.replace(/[<&]/g, "")}</strong>
    ${block("flex:1;max-width:220px;height:10px")}
    ${block("width:64px;height:18px;margin-left:auto")}
  </div>
  <div class="page">
    ${block("height:150px")}
    <div class="row">
      ${block("height:80px")}${block("height:80px")}${block("height:80px")}
    </div>
    ${block("height:80px")}
  </div>
</body>
</html>`;
}
