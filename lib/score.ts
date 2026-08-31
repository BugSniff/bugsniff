import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { namedTrackers, type Tracker } from "@/packages/tracker";

/**
 * A pontuação de conformidade da loja, de 0 a 100.
 *
 * Deliberately computed in code and never by a model: a number a model
 * produces is a number that changes between two runs over the same store, and
 * a score nobody can reproduce is a score nobody can argue with. Every point
 * traces to something the browser measured and to the article that addresses
 * it (ADR-0006).
 *
 * Two properties keep it honest. Nothing new is asserted about the store to
 * build it — every dimension reads a field the scan already holds. And a
 * dimension the reading could not measure is *excluded* rather than scored
 * zero: a policy our browser failed to reach is our failure, not the store's.
 */

/** Which half of the audit a dimension belongs to. */
export type Group = "faz" | "declara";

export type Dimension = {
  key: string;
  group: Group;
  label: string;
  /** The article this dimension is about, as the report cites it. */
  norm: string;
  /** Points available when the reading could measure it at all. */
  weight: number;
  /** Points earned, or `null` when this reading could not measure it. */
  earned: number | null;
  /** What the reading actually found, in a person's words. */
  detail: string;
};

export type Score = {
  /**
   * 0 to 100, or `null` when this reading has no business producing a number.
   *
   * Half the audit is the distance between what the store does and what it
   * declares, so a reading that never reached the declaration has nothing to
   * measure that distance against. Normalising over what was left would give a
   * store that fired no tracker a confident 100 built on 45% of the criteria —
   * the most flattering possible way to be wrong, and about the one number
   * somebody is going to act on.
   *
   * The same posture as "loja que volta sem cookie nenhum não é loja limpa"
   * (#34): a measurement that did not happen is not a good result.
   */
  value: number | null;
  /** How much of the 100 was measurable. Below 100, the score is partial. */
  measured: number;
  dimensions: Dimension[];
};

/**
 * What each dimension is worth.
 *
 * Product judgement, not law: nothing in the LGPD says consent is worth 30.
 * Kept in one place, and expected to move once there are real stores to look
 * at (ADR-0006).
 *
 * The split is 45 for what the store *does* and 55 for what it *declares*,
 * which is the product's own thesis about where the audit lives. Inside the
 * declaration half, naming the services actually observed weighs as much as
 * the whole policy being reachable, because that gap is the finding the
 * product exists to show.
 */
const WEIGHT = {
  consentimento: 30,
  banner: 15,
  politica: 10,
  nomeia: 15,
  revogacao: 7,
  controlador: 6,
  contato: 6,
  direitos: 7,
  encarregado: 4,
} as const;

type Reading = {
  consent_banner: ConsentBannerState | null;
  policy_state: string | null;
  /** Absent on a row that did not ask for it; treated the same as unread. */
  policy_text?: string | null;
  cookies: { name: string; phase?: ConsentPhase }[] | null;
  requests: { host: string; phase?: ConsentPhase }[] | null;
};

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const inPhase = (reading: Reading, phase: ConsentPhase) => ({
  cookies: (reading.cookies ?? []).filter((c) => c.phase === phase),
  requests: (reading.requests ?? []).filter((r) => r.phase === phase),
});

/** Rounds to a whole point, so the number reads as a number and not a measurement. */
const share = (part: number, whole: number, weight: number) =>
  whole === 0 ? weight : Math.round((part / whole) * weight);

export function scoreOf(reading: Reading, trackers: readonly Tracker[]): Score {
  const before = namedTrackers(inPhase(reading, "pre-consent"), trackers);
  const after = namedTrackers(inPhase(reading, "post-consent"), trackers);
  const observed = [...new Set([...before, ...after])];

  const dimensions = [
    consent(before, observed),
    banner(reading),
    ...declaration(reading, observed),
  ];

  const measured = dimensions
    .filter((d) => d.earned !== null)
    .reduce((total, d) => total + d.weight, 0);

  const earned = dimensions.reduce((total, d) => total + (d.earned ?? 0), 0);

  const read = reading.policy_state === "found" && !!reading.policy_text;

  return {
    value: read && measured > 0 ? Math.round((earned / measured) * 100) : null,
    measured,
    dimensions,
  };
}

/* ------------------------------------------------------- o que a loja faz */

function consent(before: string[], observed: string[]): Dimension {
  return {
    key: "consentimento",
    group: "faz",
    label: "Rastreadores só depois do consentimento",
    norm: "LGPD, art. 7º, I e art. 8º",
    weight: WEIGHT.consentimento,
    // The share of named services that waited. Not a curve invented to make
    // the number move: it is the proportion the reading measured.
    earned: share(
      observed.length - before.length,
      observed.length,
      WEIGHT.consentimento
    ),
    detail:
      before.length === 0
        ? observed.length === 0
          ? "Nenhum rastreador nomeado disparou nesta leitura."
          : `Os ${observed.length} rastreadores nomeados dispararam só depois do consentimento.`
        : `${before.length} de ${observed.length} rastreadores nomeados dispararam antes de qualquer interação com o banner.`,
  };
}

function banner(reading: Reading): Dimension {
  const base = {
    key: "banner",
    group: "faz" as const,
    label: "Banner de consentimento",
    norm: "LGPD, art. 8º",
    weight: WEIGHT.banner,
  };

  // Not measured, not zero. Something asks and our browser could not answer
  // it — which says nothing about whether a visitor could (#32).
  if (reading.consent_banner === "unrecognised") {
    return {
      ...base,
      earned: null,
      detail:
        "Esta loja usa uma plataforma de consentimento que nosso navegador não conseguiu responder.",
    };
  }

  return reading.consent_banner === "accepted"
    ? {
        ...base,
        earned: base.weight,
        detail: "Nosso navegador encontrou o banner e conseguiu aceitá-lo.",
      }
    : {
        ...base,
        earned: 0,
        detail:
          "Nosso navegador não encontrou banner de consentimento nesta loja, e o print é o que sustenta isso.",
      };
}

/* --------------------------------------------------- o que a loja declara */

/**
 * What the published policy has to say, as text searches over what we stored.
 *
 * Searches, not judgement: we look for the words a policy uses when it covers
 * a thing, and a policy that says the word gets the point. That errs in the
 * store's favour — a policy mentioning "revogar" in some other sentence still
 * scores — which is the direction an audit should be wrong in, the same rule
 * the disclosure check already follows.
 *
 * ponytail: a keyword list, not a reading. It cannot tell a policy that
 * explains how to revoke consent from one that merely says the word. The
 * upgrade is asking the model whether the passage actually covers it, with the
 * excerpt as evidence like a finding — worth it when a real policy is scored
 * wrong, not before.
 */
const POLICY_CHECKS: Record<
  string,
  {
    label: string;
    norm: string;
    weight: number;
    patterns: RegExp[];
    least?: number;
  }
> = {
  revogacao: {
    label: "A política diz como revogar o consentimento",
    norm: "LGPD, art. 8º, §5º",
    weight: WEIGHT.revogacao,
    patterns: [
      /\brevoga(r|cao|ndo|do)\b/,
      /\bretirar (o )?(seu )?consentimento\b/,
      /\bcancelar (o )?(seu )?consentimento\b/,
      /\bdescadastr/,
    ],
  },
  controlador: {
    label: "A política identifica o controlador",
    norm: "LGPD, art. 9º, III",
    weight: WEIGHT.controlador,
    patterns: [
      // A CNPJ is the one identifier a policy cannot borrow from a template.
      /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/,
      /\brazao social\b/,
      /\binscrita no cnpj\b/,
    ],
  },
  contato: {
    label: "A política dá um canal de contato",
    norm: "LGPD, art. 9º, IV",
    weight: WEIGHT.contato,
    patterns: [
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/,
      /\bfale conosco\b/,
      /\bcanal de atendimento\b/,
    ],
  },
  direitos: {
    label: "A política lista os direitos do titular",
    norm: "LGPD, art. 9º, VII e art. 18",
    weight: WEIGHT.direitos,
    // Two of these, not one: "eliminação" alone shows up in any retention
    // paragraph, while two together are a policy actually listing the rights.
    least: 2,
    patterns: [
      /\bart(igo)?\.? ?18\b/,
      /\bportabilidade\b/,
      /\banonimizacao\b/,
      /\bconfirmacao da existencia\b/,
      /\beliminacao dos( seus)? dados\b/,
      /\bcorrecao de dados\b/,
      /\bdireitos do titular\b/,
    ],
  },
  encarregado: {
    label: "A política informa o encarregado",
    norm: "LGPD, art. 41",
    weight: WEIGHT.encarregado,
    patterns: [/\bencarregad[oa]\b/, /\bdpo\b/, /\bdata protection officer\b/],
  },
};

function declaration(reading: Reading, observed: string[]): Dimension[] {
  const read = reading.policy_state === "found" && !!reading.policy_text;

  const published: Dimension = {
    key: "politica",
    group: "declara",
    label: "Política de privacidade publicada",
    norm: "LGPD, art. 9º",
    weight: WEIGHT.politica,
    // Not reaching a policy is our browser failing to find, never the store
    // failing to publish. Scoring it zero would put that difference on the
    // store's account, and the score says instead how little it could measure.
    earned: read ? WEIGHT.politica : null,
    detail: read
      ? "A política foi localizada a partir da loja e lida por inteiro."
      : "Nosso navegador não conseguiu chegar à política a partir da loja, o que não quer dizer que ela não exista.",
  };

  if (!read) {
    return [
      published,
      ...unmeasured(
        "nomeia",
        "A política nomeia o que a loja usa",
        "LGPD, art. 9º, V e art. 6º, VI",
        WEIGHT.nomeia
      ),
      ...Object.entries(POLICY_CHECKS).flatMap(([key, check]) =>
        unmeasured(key, check.label, check.norm, check.weight)
      ),
    ];
  }

  const policy = fold(reading.policy_text!);

  return [
    published,
    names(policy, observed),
    ...Object.entries(POLICY_CHECKS).map(([key, check]) => {
      const hits = check.patterns.filter((p) => p.test(policy)).length;
      const met = hits >= (check.least ?? 1);

      return {
        key,
        group: "declara" as const,
        label: check.label,
        norm: check.norm,
        weight: check.weight,
        earned: met ? check.weight : 0,
        detail: met
          ? "O texto da política cobre este ponto."
          : "Não encontramos este ponto no texto da política.",
      };
    }),
  ];
}

const unmeasured = (
  key: string,
  label: string,
  norm: string,
  weight: number
): Dimension[] => [
  {
    key,
    group: "declara",
    label,
    norm,
    weight,
    earned: null,
    detail: "Sem a política lida, não há o que comparar.",
  },
];

const GENERIC = new Set([
  "ads",
  "analytics",
  "cdn",
  "fonts",
  "insights",
  "manager",
  "new",
  "pixel",
  "tag",
]);

/** Whether the policy names this service. Same rule as `packages/finding`. */
const policyNames = (tracker: string, policy: string) =>
  fold(tracker)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !GENERIC.has(word))
    .some((word) => new RegExp(`\\b${word}\\b`).test(policy));

function names(policy: string, observed: string[]): Dimension {
  const named = observed.filter((tracker) => policyNames(tracker, policy));

  return {
    key: "nomeia",
    group: "declara",
    label: "A política nomeia o que a loja usa",
    norm: "LGPD, art. 9º, V e art. 6º, VI",
    weight: WEIGHT.nomeia,
    earned: share(named.length, observed.length, WEIGHT.nomeia),
    detail:
      observed.length === 0
        ? "Nenhum rastreador nomeado foi observado, então não há o que declarar."
        : `A política nomeia ${named.length} dos ${observed.length} rastreadores observados.`,
  };
}
