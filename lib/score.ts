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

/** A run of the policy's own text, marked where the check matched it. */
export type Segment = { text: string; mark?: true };

/**
 * What holds the point up, in whichever form the reading can show it.
 *
 * A sentence saying "o texto da política cobre este ponto" is not checkable —
 * nothing on the screen tells a policy that explains revocation from one that
 * says the word in passing. The evidence is what lets somebody disagree with
 * us: the excerpt we matched, the names we saw, the address where the policy
 * is published, or, for a point we did not find, the words we looked for.
 */
export type Evidence =
  | { kind: "excerpt"; caption: string; segments: Segment[] }
  | {
      kind: "names";
      caption: string;
      rows: { caption: string; items: string[]; early?: true }[];
      detail?: string;
    }
  | { kind: "link"; caption: string; href: string; detail: string }
  | { kind: "note"; caption: string; detail: string };

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
  /** What backs the sentence up. Absent on a point nothing could be shown for. */
  evidence?: Evidence;
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
  /** Where the policy was published, for the evidence to point at. */
  policy_url?: string | null;
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

/** How much of the policy to show on each side of what matched. */
const AROUND = 150;

/** `at` and `length` locate the match; `rank` is where its pattern was declared. */
type Hit = { at: number; length: number; rank: number };

/** Where each pattern matched, first match only. */
function hitsIn(folded: string, patterns: RegExp[]): Hit[] {
  return patterns
    .map((pattern, rank) => ({ match: folded.match(pattern), rank }))
    .filter(({ match }) => match?.index !== undefined)
    .map(({ match, rank }) => ({
      at: match!.index!,
      length: match![0].length,
      rank,
    }));
}

/**
 * Where a sentence ends, as a policy punctuates one.
 *
 * Two shapes, and both are narrow on purpose. Punctuation counts only when a
 * capital follows it, because "art. 18" and "Ltda., inscrita" are not new
 * sentences and opening a quote inside either one reads as a mis-citation. A
 * newline counts only when it is a blank line: policy text arrives wrapped at
 * whatever width the page used, and treating a wrap as a full stop cut the
 * controller's own name off the front of its evidence.
 *
 * Never given a `lastIndex`: `matchAll` copies it onto its own clone, so a
 * stale one silently skips the beginning of every window handed to it.
 */
const BREAK = /[.;:]\s+(?=[A-ZÀ-Þ])|\n\s*\n/g;

/** Whether the passage already ends where a sentence does. */
const ENDS = /[.;:!?]["'”’)\]]?$/;

/** The last sentence break before `before`, or null if there is none in reach. */
function breakBefore(text: string, from: number, before: number) {
  let found: number | null = null;
  for (const match of text.slice(from, before).matchAll(BREAK)) {
    found = from + match.index + match[0].length;
  }
  return found;
}

/**
 * The passage of the policy where the check found what it was looking for.
 *
 * Three rules, and each one is there because the excerpt is read as a quote.
 *
 * It is anchored on the *strongest* match, not the leftmost: the patterns are
 * declared best-first — an e-mail address before "canal de atendimento", a
 * CNPJ before "razão social" — and quoting whichever one happened to appear
 * earlier in the document gave a contact point backed by a sentence that only
 * mentions contact in passing.
 *
 * It starts at a sentence break where there is one, because a quote that opens
 * halfway through the previous sentence reads as a mis-citation even when the
 * words are exactly the store's.
 *
 * And everything else that matched inside the window is marked too, which is
 * how "portabilidade" and "eliminação dos dados" show up in the same passage.
 *
 * ponytail: the offsets come from the folded text and are used to slice the
 * original. That is only 1:1 because a precomposed accent ("á") is back to one
 * character after NFD and dropping the diacritics. A typographic ligature
 * ("ﬁ") is not, and would slide the cut by one; the upgrade is keeping an
 * index map, worth it the day a policy actually carries one.
 */
function excerptOf(text: string, folded: string, patterns: RegExp[]) {
  const hits = hitsIn(folded, patterns);
  if (hits.length === 0) return undefined;

  const anchor = hits.reduce((best, hit) =>
    hit.rank < best.rank ? hit : best
  );
  const stops = anchor.at + anchor.length;

  // Start at the sentence the match lives in, and fall back to a word boundary
  // when the passage has no break to hang on to.
  const from = Math.max(0, anchor.at - AROUND);
  const space = text.indexOf(" ", from);
  const start =
    breakBefore(text, from, anchor.at) ??
    (from === 0 || space < 0 ? from : Math.min(space + 1, anchor.at));

  // End at the sentence break after the match, or at a word boundary.
  const to = Math.min(text.length, stops + AROUND);
  const back = text.lastIndexOf(" ", to);
  const end =
    breakBefore(text, stops, to) ??
    (to === text.length || back < 0 ? to : Math.max(back, stops));

  const inside = hits
    .filter((hit) => hit.at >= start && hit.at + hit.length <= end)
    .sort((a, b) => a.at - b.at);

  const segments: Segment[] = [];
  let at = start;
  for (const hit of inside) {
    // Two patterns can match over the same words — "eliminacao dos dados" and
    // "correcao de dados" can overlap on a list. Marking one range twice cuts
    // the sentence in half, so the leftmost one wins.
    if (hit.at < at) continue;
    if (hit.at > at) segments.push({ text: text.slice(at, hit.at) });
    segments.push({
      text: text.slice(hit.at, hit.at + hit.length),
      mark: true,
    });
    at = hit.at + hit.length;
  }
  if (at < end) segments.push({ text: text.slice(at, end) });

  // The ellipses are what say the excerpt is an excerpt, and they only read as
  // ellipses with the policy's own line breaks trimmed off the ends.
  const head = segments[0];
  const tail = segments.at(-1)!;
  head.text = head.text.trimStart();
  tail.text = tail.text.trimEnd();
  if (start > 0) segments.unshift({ text: "…" });
  // No ellipsis after a full stop: "realizado até então.…" reads as a typo,
  // and the sentence having ended is exactly what the full stop already says.
  if (end < text.length && !ENDS.test(tail.text)) segments.push({ text: "…" });

  return {
    kind: "excerpt" as const,
    caption: "Trecho da política",
    segments,
  };
}

/**
 * How much a half of the score added up to, counting only what was measured.
 *
 * A group with an unmeasured dimension in it cannot be shown out of its full
 * weight: "24/45" when only 30 points were readable puts our own blind spot on
 * the store's account, which is the one thing this file exists not to do.
 */
export function tally(score: Score, group: Group) {
  const measured = score.dimensions.filter(
    (dimension) => dimension.group === group && dimension.earned !== null
  );

  return {
    earned: measured.reduce((total, d) => total + (d.earned ?? 0), 0),
    weight: measured.reduce((total, d) => total + d.weight, 0),
    /** False when this reading could not measure a single point of the group. */
    measured: measured.length > 0,
  };
}

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
  const waited = observed.filter((tracker) => !before.includes(tracker));

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
    // Which services, by name. The sentence above counts them; this is the
    // list somebody can check against the tables further down the page.
    evidence:
      observed.length === 0
        ? {
            kind: "note",
            caption: "O que esta conta olha",
            detail:
              "Só rastreador que sabemos nomear. Terceiro que o navegador viu e não soubemos nomear aparece na leitura desta página, mas não entra na nota — bloquear ou cobrar por um chute não seria leitura.",
          }
        : {
            kind: "names",
            caption: "Evidência",
            rows: [
              ...(before.length > 0
                ? [
                    {
                      caption: "Dispararam antes do consentimento",
                      items: before,
                      early: true as const,
                    },
                  ]
                : []),
              ...(waited.length > 0
                ? [{ caption: "Esperaram o aceite", items: waited }]
                : []),
            ],
          },
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
      evidence: {
        kind: "note",
        caption: "Por que não vale zero",
        detail:
          "Nosso navegador não conseguir responder ao banner não diz nada sobre um visitante conseguir. Este ponto fica de fora da conta em vez de virar zero.",
      },
    };
  }

  return reading.consent_banner === "accepted"
    ? {
        ...base,
        earned: base.weight,
        detail: "Nosso navegador encontrou o banner e conseguiu aceitá-lo.",
        evidence: {
          kind: "note",
          caption: "Evidência",
          detail:
            "O print da loja com o banner na tela está guardado com este exame — dá para conferir o que o navegador respondeu.",
        },
      }
    : {
        ...base,
        earned: 0,
        detail:
          "Nosso navegador não encontrou banner de consentimento nesta loja.",
        evidence: {
          kind: "note",
          caption: "Evidência",
          detail:
            "O print da loja aberta, sem banner nenhum na tela, está guardado com este exame. É o que sustenta esta leitura, e o que a derruba se estiver errada.",
        },
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
    /**
     * The same patterns as a person reads them.
     *
     * Only shown when the point was *not* found, and that is the whole reason
     * they exist: "não encontramos este ponto" is unfalsifiable on its own,
     * and a regex is not something to put in front of a shopkeeper. Saying
     * which words we looked for is what lets somebody tell a thorough search
     * from a lazy one — and tell us we searched for the wrong thing.
     */
    terms: string[];
  }
> = {
  revogacao: {
    label: "A política diz como revogar o consentimento",
    norm: "LGPD, art. 8º, §5º",
    weight: WEIGHT.revogacao,
    terms: [
      "revogar",
      "retirar o consentimento",
      "cancelar o consentimento",
      "descadastrar",
    ],
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
    terms: ["CNPJ", "razão social", "inscrita no CNPJ"],
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
    terms: ["um endereço de e-mail", "fale conosco", "canal de atendimento"],
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
    terms: [
      "art. 18",
      "portabilidade",
      "anonimização",
      "confirmação da existência",
      "eliminação dos dados",
      "correção de dados",
      "direitos do titular",
    ],
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
    terms: ["encarregado", "DPO", "data protection officer"],
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
    evidence: read
      ? reading.policy_url
        ? {
            kind: "link",
            caption: "Onde está publicada",
            href: reading.policy_url,
            detail: `${(reading.policy_text ?? "").length.toLocaleString("pt-BR")} caracteres lidos e guardados com este exame.`,
          }
        : undefined
      : // Nothing here: the paragraph next to the missing score already says
        // why the whole half went unmeasured, and saying it twice on the same
        // screen is the card looking for something to hold.
        undefined,
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
        evidence: met
          ? excerptOf(reading.policy_text!, policy, check.patterns)
          : {
              kind: "names" as const,
              caption: "O que procuramos no texto",
              rows: [{ caption: "", items: check.terms }],
              detail: `Nenhum destes aparece nos ${policy.length.toLocaleString("pt-BR")} caracteres lidos. Procuramos a palavra, não o cargo nem a intenção: a política pode cobrir o ponto sem usar nenhum destes termos.`,
            },
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
  const silent = observed.filter((tracker) => !named.includes(tracker));

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
    // The gap the product exists to show, named on both sides.
    evidence:
      observed.length === 0
        ? undefined
        : {
            kind: "names",
            caption: "Evidência",
            rows: [
              ...(named.length > 0
                ? [{ caption: "Nomeados na política", items: named }]
                : []),
              ...(silent.length > 0
                ? [
                    {
                      caption: "Observados e não nomeados",
                      items: silent,
                      early: true as const,
                    },
                  ]
                : []),
            ],
          },
  };
}
