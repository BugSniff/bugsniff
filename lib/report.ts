import { observe, type Reading } from "@/packages/finding";
import type { Finding } from "@/packages/finding-validator";
import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { scoreOf, type Score } from "@/lib/score";
import { namedTrackers, type Tracker } from "@/packages/tracker";

/**
 * A report is a reading of one scan, written out for a person to read.
 *
 * Not a row: `CONTEXT.md` calls it "apresentação dos achados de um exame", and
 * a scan never changes, so the report is frozen for free. Re-examining a store
 * produces another scan and therefore another report; it cannot alter this one.
 */

/** The scan, reduced to what a report is made of. */
export type Reported = {
  url: string;
  created_at: string;
  consent_banner: ConsentBannerState | null;
  policy_state: string | null;
  policy_url: string | null;
  policy_text: string | null;
  cookies: { name: string; phase?: ConsentPhase }[] | null;
  requests: { host: string; phase?: ConsentPhase }[] | null;
  findings: Finding[] | null;
};

export type Report = {
  /** The store, as a person says it. */
  store: string;
  /** When the browser read it. */
  at: Date;
  /** The three numbers the paper leads with, all pre-consent. */
  counts: { cookies: number; thirdParties: number; trackers: number };
  /** What the reading amounts to, in two paragraphs of plain Portuguese. */
  summary: string;
  /** What the store's own policy does and does not name. */
  disclosure: string | null;
  /** Only findings the validator approved ever reach here (ADR-0001). */
  findings: Finding[];
  /** The one place in the product that concludes, and it is on the paper too. */
  score: Score;
};

const before = <T extends { phase?: ConsentPhase }>(items: T[] | null) =>
  (items ?? []).filter((item) => item.phase === "pre-consent");

/** "a, b e c" — the list as somebody would say it out loud. */
export function listed(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * The paragraph that opens the report.
 *
 * Counts and names, and nothing else. No adjective, no consequence, no "apenas"
 * or "nada menos que" — the numbers are the argument, and a number that needs
 * an adverb to land is a number being used as an accusation.
 */
function summarise(
  counts: Report["counts"],
  names: readonly string[],
  banner: ConsentBannerState | null
): string {
  const read =
    banner === "accepted"
      ? "antes de qualquer interação com o banner de consentimento"
      : banner === "unrecognised"
        ? "antes de qualquer interação, num banner que nosso navegador não conseguiu responder"
        : "antes de qualquer interação, e nosso navegador não encontrou banner de consentimento nesta loja";

  const opened =
    `A loja gravou ${plural(counts.cookies, "cookie", "cookies")} e ` +
    `contactou ${plural(counts.thirdParties, "endereço de terceiro", "endereços de terceiros")} ` +
    `${read}.`;

  if (names.length === 0) {
    return `${opened} Nenhum deles pertence a um serviço de medição ou publicidade que saibamos nomear.`;
  }

  return (
    `${opened} Entre eles, ${plural(names.length, "pertence", "pertencem")} ` +
    `a ${names.length === 1 ? "um serviço nomeado" : "serviços nomeados"}: ${listed(names)}.`
  );
}

/**
 * What the store declares, next to what it does.
 *
 * `null` when there is no policy we read. Saying nothing is the only honest
 * option there: not finding a policy is our browser failing to find, never the
 * store failing to publish, and a report that blurs the two puts a false fact
 * about somebody's shop on paper.
 */
function disclosure(
  scan: Reported,
  names: readonly string[],
  trackers: readonly Tracker[]
): string | null {
  if (scan.policy_state !== "found" || !scan.policy_text) return null;

  const reading: Reading = {
    cookies: scan.cookies ?? [],
    requests: scan.requests ?? [],
    policy: { text: scan.policy_text, url: scan.policy_url },
  };

  const undisclosed = observe(reading, trackers)
    .filter((o) => o.kind === "tracker-undisclosed")
    .map((o) => o.tracker);

  const disclosed = names.filter((name) => !undisclosed.includes(name));

  const found = "A política de privacidade publicada foi localizada e lida.";
  if (names.length === 0) return found;
  if (undisclosed.length === 0) {
    return `${found} Ela cita ${listed(disclosed)}.`;
  }
  if (disclosed.length === 0) {
    return `${found} Ela não cita ${listed(undisclosed)}.`;
  }

  return `${found} Ela cita ${listed(disclosed)}; não cita ${listed(undisclosed)}.`;
}

export function reportOf(scan: Reported, trackers: readonly Tracker[]): Report {
  const cookies = before(scan.cookies);
  const requests = before(scan.requests);
  const names = namedTrackers({ cookies, requests }, trackers);

  const counts = {
    cookies: cookies.length,
    thirdParties: requests.length,
    trackers: names.length,
  };

  return {
    store: new URL(scan.url).hostname.replace(/^www\./, ""),
    at: new Date(scan.created_at),
    counts,
    summary: summarise(counts, names, scan.consent_banner),
    disclosure: disclosure(scan, names, trackers),
    findings: scan.findings ?? [],
    score: scoreOf(scan, trackers),
  };
}
