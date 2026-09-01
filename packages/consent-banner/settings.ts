/**
 * What the shop owner gets to change about their banner, and the guard on it.
 *
 * Everything here ends up inside JavaScript we hand somebody to paste into
 * their own store, so this file is not a form's convenience — it is the place
 * where a value stops being text somebody typed and becomes text we are
 * willing to generate. Colours go into a stylesheet and are refused unless
 * they are literally a hex colour; wording goes into the generated code as
 * JSON and is written to the page with `textContent`, never as markup.
 *
 * The values are the shop's, not ours. Our own palette says amber is action
 * and nothing is green (ADR-0005), and none of that applies to a banner that
 * lives on somebody else's storefront: it defaults to plain black on white and
 * is meant to be changed to whatever the shop already looks like.
 */

export type ConsentBannerSettings = {
  colors: {
    /** The banner's own surface. */
    background: string;
    /** Text on that surface. */
    foreground: string;
    /** The three buttons. */
    accent: string;
    /** Text on the buttons. */
    accentForeground: string;
  };
  text: {
    /** The line that says what is happening. */
    title: string;
    /** And the one that says what the visitor's options are. */
    body: string;
    acceptAll: string;
    rejectAll: string;
    /** Opens the purposes. Same prominence as the other two, by design. */
    manage: string;
    save: string;
    /** The purposes, as the panel names them. */
    essential: string;
    analytics: string;
    marketing: string;
  };
};

/**
 * The banner as it comes, in the words the design canvas proposed.
 *
 * The second sentence is doing work: "enquanto não responder, nada é acionado"
 * is a claim about the code below it, and it is true only because the blocking
 * happens before the question is asked. If that ever stops being true, this
 * sentence is the one that becomes a lie on somebody else's storefront.
 */
export const DEFAULT_SETTINGS: ConsentBannerSettings = {
  colors: {
    background: "#ffffff",
    foreground: "#18181b",
    accent: "#18181b",
    accentForeground: "#ffffff",
  },
  text: {
    title: "Usamos cookies para medir audiência e mostrar anúncios.",
    body: "Você escolhe o que aceitar. Enquanto não responder, nada é acionado além do necessário para a loja funcionar.",
    acceptAll: "Aceitar tudo",
    rejectAll: "Recusar",
    manage: "Escolher",
    save: "Salvar escolhas",
    essential: "Necessários para a loja funcionar",
    analytics: "Medição de audiência",
    marketing: "Publicidade",
  },
};

/** Three or six hex digits, and nothing else, because this goes into CSS. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** How long a piece of wording may be, by the job it does. */
const LIMITS: Record<keyof ConsentBannerSettings["text"], number> = {
  title: 160,
  body: 400,
  acceptAll: 40,
  rejectAll: 40,
  manage: 40,
  save: 40,
  essential: 60,
  analytics: 60,
  marketing: 60,
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

/**
 * The settings to generate with, from whatever the database happens to hold.
 *
 * Field by field against the defaults rather than trusting the stored document:
 * a `jsonb` column holds any shape, this one has been written by an older
 * version of the form before and will be again, and a missing colour has to
 * come out as black rather than as `undefined` inside a stylesheet.
 *
 * A value that fails its check falls back to the default silently. The form is
 * the place to tell somebody their colour is not a colour; by the time the code
 * is being generated, the only useful outcome is a banner that works.
 */
export function settingsFrom(stored: unknown): ConsentBannerSettings {
  const document = asRecord(stored);
  const colors = asRecord(document.colors);
  const text = asRecord(document.text);

  const color = (key: keyof ConsentBannerSettings["colors"]) => {
    const value = colors[key];
    return typeof value === "string" && HEX.test(value.trim())
      ? value.trim()
      : DEFAULT_SETTINGS.colors[key];
  };

  const words = (key: keyof ConsentBannerSettings["text"]) => {
    const value = text[key];
    if (typeof value !== "string") return DEFAULT_SETTINGS.text[key];
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.length <= LIMITS[key]
      ? trimmed
      : DEFAULT_SETTINGS.text[key];
  };

  return {
    colors: {
      background: color("background"),
      foreground: color("foreground"),
      accent: color("accent"),
      accentForeground: color("accentForeground"),
    },
    text: {
      title: words("title"),
      body: words("body"),
      acceptAll: words("acceptAll"),
      rejectAll: words("rejectAll"),
      manage: words("manage"),
      save: words("save"),
      essential: words("essential"),
      analytics: words("analytics"),
      marketing: words("marketing"),
    },
  };
}
