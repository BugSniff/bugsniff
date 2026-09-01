/**
 * Quem responde pela loja, dito uma vez e reusado em tudo que ela gera.
 *
 * The LGPD calls this the controller, and three of the score's nine dimensions
 * are about whether the published policy identifies one: article 9º, III wants
 * who, IV wants a channel to reach them, and 41 wants the encarregado. A
 * document that leaves those out fails the audit the product itself runs.
 *
 * Every field is optional, and that is the decision this file exists to carry.
 * A shop owner who has not typed their CNPJ gets a document with a visible gap
 * where it goes — never a plausible-looking number, never a sentence quietly
 * rewritten to not need one. We are generating a legal document about somebody
 * else's company: inventing a fact there is worse than shipping a blank.
 */

export type Company = {
  /** Razão social, as it is on the CNPJ card. */
  legalName: string;
  cnpj: string;
  /** Where the company is, as an address a person could post a letter to. */
  address: string;
  /** Where a visitor writes to exercise their rights. */
  email: string;
  /** The encarregado (art. 41), when the company has named one. */
  officer: string;
  officerEmail: string;
};

export const EMPTY_COMPANY: Company = {
  legalName: "",
  cnpj: "",
  address: "",
  email: "",
  officer: "",
  officerEmail: "",
};

/**
 * The mark a missing field leaves in the generated text.
 *
 * Loud on purpose, and the same string everywhere so that finding out whether a
 * document is finished is one search. A document is not publishable while one
 * of these is in it — that is a rule the screen enforces, and it can only
 * enforce it because the gap is impossible to miss.
 */
export const BLANK = "[PREENCHER]";

const FIELDS = Object.keys(EMPTY_COMPANY) as (keyof Company)[];

/** How long any one of these may be. Nothing here is prose. */
const LONGEST = 200;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

/** The company as the database happens to hold it, field by field. */
export function companyFrom(stored: unknown): Company {
  const document = asRecord(stored);

  return Object.fromEntries(
    FIELDS.map((field) => {
      const value = document[field];
      const text = typeof value === "string" ? value.trim() : "";
      return [field, text.length <= LONGEST ? text : ""];
    })
  ) as Company;
}

/** What is still missing, in the order the form asks for it. */
export function missingFrom(company: Company): (keyof Company)[] {
  return FIELDS.filter((field) => company[field].length === 0);
}

/**
 * The value, or the blank that says it is missing.
 *
 * The one place the generated text is allowed to be incomplete, and it is
 * deliberate: the alternative is a document that reads as finished while the
 * controller it names is nobody.
 */
export const orBlank = (value: string) => (value.trim() ? value.trim() : BLANK);
