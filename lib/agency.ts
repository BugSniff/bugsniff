/**
 * Como quarenta lojas viram uma lista que alguém consegue usar.
 *
 * A diferença entre o lojista e a agência nunca foi de entidade — o CONTEXT.md
 * diz que são a mesma organização, e diferem no número de lojas. É aqui que o
 * número passa a importar: cinco linhas leem-se de cima a baixo, quarenta
 * precisam de agrupamento, ordem e recorte, ou a tela deixa de responder à
 * única pergunta que a agência tem, que é "por onde eu começo hoje".
 *
 * Tudo puro e sem consulta ao banco: a ordenação de quarenta linhas em memória
 * é mais barata do que a ida ao servidor que a evitaria, e mantém a regra
 * testável sem subir Postgres.
 */

/** Uma loja como a lista da agência a mostra. */
export type AgencyRow = {
  id: string;
  host: string;
  /** O rótulo do cliente. Nulo é o caso comum: o lojista nunca preenche. */
  client: string | null;
  /** Quantas leituras esta loja tem. */
  exams: number;
  /** Achados da leitura mais recente que concluiu. */
  findings: number;
  /** A pontuação dessa leitura, quando ela pôde ser calculada. */
  score: number | null;
  /**
   * Quantos serviços nomeados dispararam antes do consentimento.
   *
   * Nulo quando a leitura não concluiu, e nunca zero: zero é uma afirmação sobre
   * a loja, e uma medição que não aconteceu não pode fazê-la (#34).
   */
  beforeConsent: number | null;
  /** Quando foi a leitura mais recente, tenha ela concluído ou não. */
  readAt: string;
  /** Se a leitura mais recente não aconteceu, e por quê. */
  failure: string | null;
};

/**
 * As faixas pelas quais a lista se recorta.
 *
 * Deliberadamente **pontuação** e não "gravidade". O glossário lista `gravidade`
 * entre as palavras a evitar para achado, e o ADR-0005 tirou o verde da paleta
 * justamente para que nenhuma cor conclua. A nota é o único lugar onde este
 * produto conclui de propósito (ADR-0006), então é ela — e só ela — que serve de
 * recorte. Uma coluna "gravidade" seria uma segunda conclusão, num lugar que
 * ninguém decidiu abrir.
 *
 * Sem nota é uma faixa e não um resto: uma leitura que não alcançou a política
 * não tem nota porque **a nossa medição não terminou**, não porque a loja está
 * mal. É a linha que mais precisa de alguém olhando.
 */
export const BANDS = {
  "sem-nota": { label: "Sem nota", holds: (s: number | null) => s === null },
  "ate-49": {
    label: "Até 49",
    holds: (s: number | null) => s !== null && s < 50,
  },
  "50-79": {
    label: "De 50 a 79",
    holds: (s: number | null) => s !== null && s >= 50 && s < 80,
  },
  "80-100": {
    label: "80 ou mais",
    holds: (s: number | null) => s !== null && s >= 80,
  },
} as const;

export type Band = keyof typeof BANDS;

export const isBand = (value: string | undefined): value is Band =>
  value !== undefined && value in BANDS;

/** Por onde a lista pode ser ordenada, e o que cada uma compara. */
export const SORTS = {
  loja: (a: AgencyRow, b: AgencyRow) => a.host.localeCompare(b.host),
  cliente: (a: AgencyRow, b: AgencyRow) =>
    (a.client ?? "￿").localeCompare(b.client ?? "￿"),
  achados: (a: AgencyRow, b: AgencyRow) => a.findings - b.findings,
  /**
   * Sem nota vem antes de qualquer nota, nas duas direções.
   *
   * Não é um empate a desempatar: é a linha sobre a qual não sabemos nada, e
   * enterrá-la no fim de uma lista de quarenta é o mesmo que escondê-la. Ela
   * fica onde o olho começa.
   */
  pontuacao: (a: AgencyRow, b: AgencyRow) =>
    a.score === null || b.score === null
      ? Number(a.score !== null) - Number(b.score !== null)
      : a.score - b.score,
  exame: (a: AgencyRow, b: AgencyRow) =>
    Date.parse(a.readAt) - Date.parse(b.readAt),
} as const;

export type Sort = keyof typeof SORTS;

export const isSort = (value: string | undefined): value is Sort =>
  value !== undefined && value in SORTS;

export type View = {
  sort: Sort;
  descending: boolean;
  client?: string;
  band?: Band;
};

/** A lista recortada e ordenada como a tela pediu. */
export function applyView(
  rows: readonly AgencyRow[],
  { sort, descending, client, band }: View
): AgencyRow[] {
  const kept = rows.filter(
    (row) =>
      (client === undefined || (row.client ?? "") === client) &&
      (band === undefined || BANDS[band].holds(row.score))
  );

  const sorted = [...kept].sort(SORTS[sort]);
  return descending ? sorted.reverse() : sorted;
}

/**
 * As lojas sob o cliente de cada uma, na ordem em que já estão.
 *
 * O agrupamento respeita a ordenação em vez de a substituir: quem ordenou por
 * pontuação quer ver o pior cliente primeiro, e reordenar os grupos por nome
 * desfaria a pergunta que a pessoa acabou de fazer.
 *
 * Loja sem cliente vira um grupo sem nome, no fim. Chamá-lo de "Sem cliente"
 * daria a um lojista de uma loja só um cabeçalho sobre uma distinção que não
 * existe no negócio dele.
 */
export function groupByClient(
  rows: readonly AgencyRow[]
): { client: string | null; rows: AgencyRow[] }[] {
  const groups = new Map<string | null, AgencyRow[]>();

  for (const row of rows) {
    const key = row.client || null;
    const found = groups.get(key);
    if (found) found.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .map(([client, rows]) => ({ client, rows }))
    .sort((a, b) => Number(a.client === null) - Number(b.client === null));
}

/** Os clientes que existem nesta organização, para oferecer o recorte. */
export const clientsOf = (rows: readonly AgencyRow[]): string[] =>
  [
    ...new Set(rows.map((row) => row.client).filter((c): c is string => !!c)),
  ].sort((a, b) => a.localeCompare(b));
