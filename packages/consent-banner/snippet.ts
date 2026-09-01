import { purposesIn, type Blocklist } from "./blocklist";
import { CONFIG_PLACEHOLDER, RUNTIME } from "./lib/runtime";
import { DEFAULT_SETTINGS, type ConsentBannerSettings } from "./settings";

/**
 * The banner as one file, with nothing in it that phones home.
 *
 * That is the decision this module exists to carry, and it is recorded in
 * ADR-0007: what the shop installs is the whole thing, not a loader for a
 * script we host. A hosted script would be easier to update and would put us
 * on every page view of every store we audit — an audit tool that becomes the
 * biggest third party on its customer's storefront, reporting to itself. The
 * cost of the choice is that an update means pasting again, and the person is
 * told so.
 *
 * Everything varying is embedded as JSON. `<` is escaped so no piece of
 * wording can close the script tag it is travelling inside, which is the one
 * way text from a form could stop being text.
 */

/** JSON that is safe to sit inside a `<script>` element. */
const embed = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

/** No sequence that could end the HTML comment the names travel in. */
const inComment = (value: string) => value.replace(/--+/g, "-");

/**
 * The note above the code, addressed to whoever is about to paste it.
 *
 * In Portuguese, unlike the code below it: this is the product talking to a
 * shop owner, and it is the only documentation that travels with the file
 * after it leaves our screen. The two limits are stated here rather than only
 * on our page, because this is where somebody will be standing when they hit
 * one of them.
 */
function header(blocklist: Blocklist): string {
  const names = blocklist.blocked.map(({ name }) => name);

  const blocks =
    names.length > 0
      ? `Bloqueia até a resposta: ${inComment(names.join(", "))}.`
      : "Hoje não bloqueia nada: o exame não encontrou rastreador nomeado nesta loja. Vale para o que aparecer depois.";

  return `<!--
  Banner de consentimento do bugsniff.

  ${blocks}

  Onde colar: o mais alto possível dentro do <head>, antes de qualquer outro
  script. O bloqueio vale para o que roda depois dele.

  Para a pessoa mudar de ideia, ponha no rodapé da loja um link assim:
  <a href="#" onclick="bugsniffConsent.open(); return false">Preferências de cookies</a>

  Dois limites, ditos aqui porque é aqui que se tropeça neles: cookie que o
  servidor da loja manda no cabeçalho da resposta não passa por este código, e
  tag de rastreador escrita à mão no tema é buscada pelo navegador antes de
  qualquer script rodar. Os dois se resolvem pela instalação via plataforma.

  Gerado a partir do último exame desta loja. Um exame novo pode encontrar
  rastreador novo — nesse caso, gere e cole de novo.
-->`;
}

/**
 * The code to install, ready to paste.
 *
 * Deterministic: same reading and same settings, same bytes. Nothing dated or
 * random goes in, so the file on somebody's storefront can be compared against
 * the one on our screen and either match or not.
 */
export function bannerSnippet(
  blocklist: Blocklist,
  settings: ConsentBannerSettings = DEFAULT_SETTINGS
): string {
  const config = embed({
    blocked: blocklist.blocked,
    // The purposes the panel offers, which are the ones this store has. The
    // runtime asks nothing it cannot act on.
    purposes: purposesIn(blocklist),
    colors: settings.colors,
    text: settings.text,
  });

  // A function as the replacement, not the string: `$&` typed into the
  // wording would otherwise be read as a substitution and paste the
  // placeholder back into the config.
  return `${header(blocklist)}
<script>
${RUNTIME.replace(CONFIG_PLACEHOLDER, () => config)}</script>`;
}
