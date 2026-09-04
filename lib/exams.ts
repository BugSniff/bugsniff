import type { ConsentBannerState, ConsentPhase } from "@/packages/scan/scan";
import { namedTrackers, type Tracker } from "@/packages/tracker";

/** A scan, reduced to what a list of them needs. */
export type Exam = {
  id: string;
  url: string;
  status: string;
  consent_banner: ConsentBannerState | null;
  policy_state: string | null;
  policy_text?: string | null;
  cookies: { name: string; phase?: ConsentPhase }[] | null;
  requests: { host: string; phase?: ConsentPhase }[] | null;
  created_at: string;
  store_id: string | null;
  /** Why the reading did not happen. Only ever set on a failed scan. */
  failure?: string | null;
  /** Os achados publicáveis desta leitura. Ausente onde a lista não os pediu. */
  findings?: unknown[] | null;
};

/**
 * Por que um exame não aconteceu, na frase que a pessoa pode usar.
 *
 * Um só lugar, porque a mesma leitura falhada aparece em três telas — o exame,
 * a loja e o painel — e "não medido" sem motivo é a versão da falha que ninguém
 * consegue atender. Quem abre o painel e vê uma loja que não mediu precisa
 * saber, ali, se a loja estava fora do ar ou se ela nos barrou.
 *
 * Chaves de texto e não do tipo `ScanRejection`: a fila também escreve aqui
 * (`abandoned`, de `requeue_stuck_scans`), e essa não é uma recusa da loja — é
 * uma invocação nossa que morreu. Um `Record` fechado obrigaria a fingir que os
 * dois vêm do mesmo lugar.
 */
const FAILURES: Record<string, string> = {
  malformed: "O endereço não pôde ser lido.",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço.",
  "private-address": "Esse endereço não é público.",
  unreachable: "A loja não respondeu a tempo. Pode estar fora do ar.",
  blocked:
    "A loja respondeu ao nosso navegador com uma página de erro, não com a loja. Não é um exame limpo: é um exame que não aconteceu.",
  unfinished:
    "A loja respondeu, mas o carregamento dela não terminou dentro do tempo do exame, e nosso navegador não chegou a observar nada. Não é loja limpa: é um exame que não aconteceu.",
  abandoned:
    "O exame começou e a execução dele foi interrompida antes de terminar. Não é uma resposta da loja: é uma falha nossa, e ele foi tentado de novo até desistirmos.",
  "browser-unavailable":
    "Nosso navegador não subiu, então a loja não chegou a ser aberta. Não é uma resposta da loja: é uma falha nossa, e não há nada a corrigir do lado de quem pediu o exame.",
};

/** A frase inteira. */
export const failureMessage = (failure: string | null | undefined): string =>
  FAILURES[failure ?? ""] ?? "O exame não pôde ser concluído.";

/**
 * A mesma coisa em meia linha, para caber numa célula de tabela.
 *
 * A primeira oração da frase inteira. Deliberadamente derivado e não uma
 * segunda lista: duas redações do mesmo motivo divergem no dia em que alguém
 * corrige uma delas.
 */
export const failureShort = (failure: string | null | undefined): string =>
  failureMessage(failure).split(". ")[0].replace(/\.$/, "");

/** A store, with what its readings add up to. */
export type StoreSummary = {
  id: string;
  host: string;
  /** How many readings there are. A store always has at least one. */
  exams: number;
  /** The most recent one, which is what a list of stores is really showing. */
  latest: Exam;
};

/**
 * Which services fired in one reading of the store, in one of its two states.
 *
 * Counted at read time from the tracker table rather than stored on the scan,
 * so a service named in the table today names the cookies of a reading taken
 * last week — which is the whole point of keeping that list as data.
 */
export function trackersIn(
  exam: Exam,
  phase: ConsentPhase,
  trackers: readonly Tracker[]
): string[] {
  if (exam.status !== "done") return [];

  return namedTrackers(
    {
      cookies: (exam.cookies ?? []).filter((c) => c.phase === phase),
      requests: (exam.requests ?? []).filter((r) => r.phase === phase),
    },
    trackers
  );
}

/**
 * Groups readings under the stores they are readings of.
 *
 * `exams` has to arrive newest first — the first one seen for a store is the
 * one the list shows. A store with no reading at all cannot happen: a store is
 * created by the scan that first names it, so one with none is a row we failed
 * to clean up, and it is dropped rather than shown as a store nothing is known
 * about.
 */
export function summarise(
  stores: readonly { id: string; host: string }[],
  exams: readonly Exam[]
): StoreSummary[] {
  const byStore = new Map<string, Exam[]>();
  for (const exam of exams) {
    if (!exam.store_id) continue;
    const list = byStore.get(exam.store_id);
    if (list) list.push(exam);
    else byStore.set(exam.store_id, [exam]);
  }

  return stores
    .map(({ id, host }) => {
      const own = byStore.get(id) ?? [];
      return own.length > 0
        ? { id, host, exams: own.length, latest: own[0] }
        : null;
    })
    .filter((store): store is StoreSummary => store !== null)
    .sort(
      (a, b) =>
        Date.parse(b.latest.created_at) - Date.parse(a.latest.created_at)
    );
}
