/**
 * Typographic spellings of characters that mean the same thing.
 *
 * A published law is typeset, and text copied out of it carries the typesetting
 * with it: a non-breaking hyphen in "boa‑fé", a curly apostrophe, a narrow space
 * before a colon. None of those change what the passage says, and all of them
 * make a byte comparison fail — which would reject a finding whose citation is
 * exactly right, in the one check the whole product rests on.
 *
 * The same tolerance the accents and the casing already get, for the same
 * reason. It does not let an invented quotation through: the words still have
 * to be the words.
 */
const VARIANTS: readonly (readonly [RegExp, string])[] = [
  [/[\u2010-\u2015\u2043\u2212]/g, "-"], // hyphens, dashes, minus sign
  [/[\u2018\u2019\u201b\u02bc]/g, "'"], // curly and modifier apostrophes
  [/[\u201c\u201d\u201f]/g, '"'], // curly quotes
  [/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, " "], // fixed-width spaces
  [/[\u200b-\u200d\ufeff\u00ad]/g, ""], // zero-width joiners, soft hyphen
];

/** Strips accents, case, typography and excess whitespace for tolerant comparison. */
export function normalize(text: string): string {
  const folded = VARIANTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text
  );

  return folded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
