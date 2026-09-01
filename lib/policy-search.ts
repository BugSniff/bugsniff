import type { LinkOutcome, PolicySearch } from "@/packages/scan/scan";

/**
 * How the search for the policy is shown, on the screen and on the paper.
 *
 * One module for both because it is one claim. The report ends on sentences
 * like "nosso navegador não chegou à política desta loja", and that sentence
 * is honest but unfalsifiable on its own: nothing lets the reader tell a
 * thorough search from a lazy one. This is what makes it checkable — how many
 * links the page carried, which of them touched the subject, and what happened
 * to each one we followed.
 *
 * The wording never blames the store. "Não abriu para o nosso navegador" is a
 * fact about the exchange; "a loja escondeu a política" would be an accusation,
 * and measured on smiles.com.br the truth is neither — the link was right there
 * in the footer, and the server behind it answered 403.
 */

export const OUTCOME: Record<LinkOutcome, string> = {
  policy: "é a política que lemos",
  hub: "abrimos, e procuramos a política a partir dela",
  refused: "não abriu para o nosso navegador",
  "not-policy": "abrimos, e não era a política",
  "not-followed": "não seguimos",
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * How wide the search was, in one sentence.
 *
 * The total is the part that carries the argument. Seven candidates out of
 * seven links is a small page; seven out of two hundred and seventy-five is a
 * search that went through everything the page had.
 */
export function searchSummary(survey: PolicySearch): string {
  if (survey.seen === 0) {
    return "Não encontramos nenhum link nesta página para seguir.";
  }

  const links = plural(survey.seen, "link", "links");

  if (survey.candidates.length === 0) {
    return `Olhamos os ${links} desta página, e nenhum deles falava de política, privacidade ou cookies.`;
  }

  const candidates = plural(
    survey.candidates.length,
    "tinha a ver com o assunto",
    "tinham a ver com o assunto"
  );

  return `Olhamos os ${links} desta página; ${candidates}.`;
}
