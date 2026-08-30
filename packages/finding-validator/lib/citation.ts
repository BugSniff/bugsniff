import { normalize } from "./text";

/**
 * The quoted excerpt must actually occur in the norm's source text. This is what
 * separates a citation from an invention: the model never cites from memory, it
 * cites from the source it was handed in context (ADR-0001).
 */
export function excerptIsInSource(excerpt: string, source: string): boolean {
  const needle = normalize(excerpt);
  return needle.length > 0 && normalize(source).includes(needle);
}
