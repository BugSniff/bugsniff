import { normalize } from "./text";

/**
 * The canonical list lives in CONTEXT.md, section "Linguagem proibida". A test
 * compares both and fails when they drift, so the glossary cannot quietly
 * become fiction.
 *
 * The terms stay in Portuguese on purpose: they are the words the product is
 * forbidden from writing, and the product writes in Portuguese. They are data,
 * not code.
 */
export const FORBIDDEN_TERMS = [
  "irregular",
  "em desacordo",
  "violação",
  "infração",
  "ilegal",
  "multa",
  "penalidade",
  "sujeito a sanção",
  "não conforme",
  "risco jurídico",
  "você deve",
  "obrigatório",
] as const;

const NORMALIZED = FORBIDDEN_TERMS.map(
  (term) => [term, normalize(term)] as const
);

/** Forbidden terms present in the text, returned as listed in FORBIDDEN_TERMS. */
export function findForbiddenTerms(text: string): string[] {
  const haystack = normalize(text);
  return NORMALIZED.filter(([, n]) => haystack.includes(n)).map(
    ([term]) => term
  );
}
