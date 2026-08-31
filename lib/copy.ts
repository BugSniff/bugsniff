/**
 * The words the public funnel may say, and the rule that keeps them ours.
 *
 * Everything that varies on these screens arrives in the query string — the
 * address a link was sent to, why a link no longer opens, why one could not be
 * sent — and a query string is written by whoever wrote the link. So nothing
 * from the URL is ever printed: it is looked up here, and a value that matches
 * nothing lands on a sentence we wrote. Anyone can craft a link to this page;
 * nobody can craft one that makes it say a sentence of their choosing.
 *
 * The single exception is the address itself, which is shown only when it is
 * an address and nothing else — see `showAddress`.
 */

/** Supabase's send failures, reduced to the three this page distinguishes. */
const SEND_FAILURES: Record<string, string> = {
  over_email_send_rate_limit: "muitos",
  email_address_invalid: "invalido",
  validation_failed: "invalido",
};

const SEND_MESSAGES: Record<string, string> = {
  muitos: "Pedidos demais em pouco tempo. Espere um momento e tente de novo.",
  invalido: "Esse e-mail não parece válido. Confira e tente de novo.",
  falhou: "Não conseguimos enviar o link agora. Tente de novo.",
};

/** The codes `auth/callback` sends here, as the heading of the card. */
const REFUSALS: Record<string, string> = {
  expirado: "Este link expirou ou já foi usado",
  recusado: "Este link foi recusado",
};

/** Which of our codes to put in the URL for one of Supabase's. */
export const sendFailure = (code: string): string =>
  SEND_FAILURES[code] ?? "falhou";

/** What that code says. Never the provider's own words. */
export const sendMessage = (code: string): string =>
  SEND_MESSAGES[code] ?? SEND_MESSAGES.falhou;

/** Why a link no longer opens, headed as a fact about the link. */
export const refusalHeading = (code: string): string =>
  REFUSALS[code] ?? "Este link não vale mais";

/**
 * Whether a value from the URL is an address we can show back.
 *
 * The sent screen says where the link went, because that is the one thing a
 * person checks before leaving for their inbox. Shown only when it is shaped
 * like an address, so the line cannot be turned into a sentence.
 */
export const showAddress = (value: string): boolean =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Why a scan could not be started, in words the person can act on.
 *
 * The first five are `TargetRejection` from `@/packages/scan/target-url`, which
 * is already a closed set — the codes go in the URL unchanged and are read back
 * through here.
 */
const SCAN_REFUSALS: Record<string, string> = {
  malformed: "Isso não parece um endereço. Tente algo como loja.com.br",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço. Confira se está escrito certo.",
  "private-address":
    "Esse endereço não é público, então não há o que examinar.",
  "nao-registrado": "Não conseguimos registrar o exame. Tente de novo.",
  "sem-organizacao": "Sua conta não está ligada a nenhuma organização.",
  "nao-enviado": "Não conseguimos enviar o link agora. Tente de novo.",
};

export const scanRefusal = (code: string): string =>
  SCAN_REFUSALS[code] ?? "Não conseguimos começar o exame. Tente de novo.";
