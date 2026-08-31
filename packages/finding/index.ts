import {
  validateFindings,
  type Finding,
  type ValidationResult,
} from "../finding-validator/index";
import {
  evidenceFor,
  observe,
  type Observation,
  type Reading,
} from "./lib/observe";
import { write, type Writer } from "./lib/write";
import { normById, NORM_SOURCES } from "./norms";

/**
 * From a reading of a store to the findings it supports.
 *
 * Three steps, and only the middle one involves a model: the facts are
 * extracted in code, the prose and the quoted passage are written by the
 * model, and the result is put through the validator before it leaves this
 * function. Nothing here can return a finding the validator rejected —
 * `rejected` is carried out so it can be counted and looked at, never
 * published (ADR-0001).
 */
export type { Observation, Reading };
export { observe };

export async function deriveFindings(
  reading: Reading,
  trackers: readonly {
    name: string;
    cookie_pattern: string | null;
    host_pattern: string | null;
  }[],
  writer: Writer = write
): Promise<ValidationResult> {
  return deriveFrom(observe(reading, trackers), writer);
}

/** The same, from observations already extracted. Used by the eval. */
export async function deriveFrom(
  observations: readonly Observation[],
  writer: Writer = write
): Promise<ValidationResult> {
  const written = await Promise.all(
    observations.map(async (observation) => {
      const draft = await writer(observation);
      if (!draft) return null;

      // The citation is never the model's to write: it is looked up from the
      // id it picked, and an id outside the norms is a finding the validator
      // will reject as unknown rather than one this function invents a name for.
      const norm = normById(draft.normId);

      const finding: Finding = {
        observedFact: draft.observedFact,
        evidence: evidenceFor(observation),
        normId: draft.normId,
        // Falls back to the id, not to empty: an id outside our norms is
        // headed for the validator's `unknown-norm`, and that is the defect
        // worth naming. An empty field would get it rejected one check earlier,
        // reported as a missing citation rather than an invented norm.
        normCitation: norm?.citation ?? draft.normId,
        normExcerpt: draft.normExcerpt,
      };

      return finding;
    })
  );

  return validateFindings(
    written.filter((finding): finding is Finding => finding !== null),
    NORM_SOURCES
  );
}
