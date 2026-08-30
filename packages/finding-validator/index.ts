import { excerptIsInSource } from "./lib/citation";
import { findForbiddenTerms } from "./lib/forbidden-language";

export { FORBIDDEN_TERMS } from "./lib/forbidden-language";

/**
 * A finding: an observed fact plus the norm that addresses it.
 *
 * Note what is absent: there is no field where a verdict about the merchant's
 * legal standing could go. That is a type-level guarantee rather than a runtime
 * check — a conclusion cannot be filled in because there is nowhere to put it
 * (ADR-0001).
 */
export type Finding = {
  /** Fact observed on the store. Authored by the product. */
  readonly observedFact: string;
  /** Concrete evidence for the fact. Authored by the product. */
  readonly evidence: string;
  /** Norm source id, drawn from a closed vocabulary. */
  readonly normId: string;
  /** Human-readable reference to the norm. Authored by the product. */
  readonly normCitation: string;
  /** Verbatim excerpt copied from the source. NOT authored by the product. */
  readonly normExcerpt: string;
};

export type RejectionReason =
  | { readonly kind: "empty-field"; readonly field: string }
  | { readonly kind: "forbidden-language"; readonly terms: readonly string[] }
  | { readonly kind: "unknown-norm"; readonly normId: string }
  | { readonly kind: "excerpt-not-in-source"; readonly normId: string };

export type Rejection = {
  readonly finding: Finding;
  readonly reason: RejectionReason;
};

export type ValidationResult = {
  readonly approved: readonly Finding[];
  readonly rejected: readonly Rejection[];
};

/** Norm source texts, keyed by norm id. */
export type NormSources = ReadonlyMap<string, string>;

/**
 * Fields the product authors.
 *
 * `normExcerpt` is deliberately excluded: it is legal text copied verbatim, and
 * the law uses precisely the words the product may not use — "infração",
 * "sanção", "obrigatório". Scanning the quoted excerpt would reject every
 * correct finding and leave the validator worthless.
 */
const AUTHORED_FIELDS = ["observedFact", "evidence", "normCitation"] as const;

const REQUIRED_FIELDS = [...AUTHORED_FIELDS, "normExcerpt", "normId"] as const;

function findLocalDefect(finding: Finding): RejectionReason | null {
  for (const field of REQUIRED_FIELDS) {
    if (finding[field].trim() === "") return { kind: "empty-field", field };
  }
  const terms = AUTHORED_FIELDS.flatMap((f) => findForbiddenTerms(finding[f]));
  if (terms.length > 0) {
    return { kind: "forbidden-language", terms: [...new Set(terms)] };
  }
  return null;
}

/**
 * Splits findings into publishable and rejected. Nothing is displayed or stored
 * without passing through here.
 */
export function validateFindings(
  findings: readonly Finding[],
  sources: NormSources
): ValidationResult {
  const approved: Finding[] = [];
  const rejected: Rejection[] = [];

  for (const finding of findings) {
    const defect = findLocalDefect(finding);
    if (defect) {
      rejected.push({ finding, reason: defect });
      continue;
    }

    const source = sources.get(finding.normId);
    if (source === undefined) {
      rejected.push({
        finding,
        reason: { kind: "unknown-norm", normId: finding.normId },
      });
    } else if (!excerptIsInSource(finding.normExcerpt, source)) {
      rejected.push({
        finding,
        reason: { kind: "excerpt-not-in-source", normId: finding.normId },
      });
    } else {
      approved.push(finding);
    }
  }

  return { approved, rejected };
}
