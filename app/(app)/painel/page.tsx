import { IconAlertCircle, IconScan, IconRefresh } from "@tabler/icons-react";
import { Fragment } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Mark } from "@/components/brand";
import { NewScan } from "@/components/new-scan";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applyView,
  BANDS,
  clientsOf,
  groupByClient,
  isBand,
  isSort,
  type AgencyRow,
  type Sort,
} from "@/lib/agency";
import {
  failureShort,
  summarise,
  trackersIn,
  type Exam,
  type StoreSummary,
} from "@/lib/exams";
import { scoreOf } from "@/lib/score";
import { timeAgo } from "@/lib/time";
import { createClient } from "@/packages/supabase/server";
import type { Tracker } from "@/packages/tracker";
import { nameClient, scanAll } from "./actions";

/**
 * O painel: as lojas desta organização, e por onde começar hoje.
 *
 * Uma tela e não duas. O lojista com uma loja e a agência com quarenta são a
 * mesma organização (CONTEXT.md), então o que muda com a escala é o que a lista
 * oferece — agrupar por cliente, ordenar, recortar por faixa de pontuação,
 * examinar todas — e nada disso aparece para quem tem uma loja só, porque não há
 * o que agrupar nem o que comparar.
 */

/**
 * Quantas leituras buscar para saber onde cada loja está.
 *
 * ponytail: toda leitura da organização, agrupada em memória, porque a poucas
 * dezenas de exames isso é uma consulta em vez de uma por loja. No dia em que
 * uma agência de quarenta lojas tiver um ano de leituras semanais isto vira duas
 * mil linhas para resumir quarenta, e a resposta é uma view que devolve a última
 * por loja — não um limite maior.
 */
const READINGS = 500;

/** As colunas por onde a lista pode ser ordenada, com o nome que a tela usa. */
const COLUMNS: { key: Sort; label: string }[] = [
  { key: "loja", label: "Loja" },
  { key: "cliente", label: "Cliente" },
  { key: "achados", label: "Achados" },
  { key: "pontuacao", label: "Pontuação" },
  { key: "exame", label: "Último exame" },
];

/** O que aconteceu, em palavras nossas. Nada vem da URL. */
const NOTICES: Record<string, string> = {
  nenhum: "Nada a examinar: todas as lojas já estão na fila.",
  "sem-organizacao": "Sua conta não está em nenhuma organização.",
  "sem-permissao": "Você não tem permissão para isso.",
  "nao-registrado": "Não conseguimos enfileirar os exames agora.",
};

type Params = {
  erro?: string;
  lote?: string;
  ordenar?: string;
  dir?: string;
  cliente?: string;
  faixa?: string;
};

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // RLS escopa tudo isto às organizações de quem pede, então não há filtro a
  // aplicar aqui e nada a vazar perguntando.
  const supabase = await createClient();
  const [{ data: stores }, { data: exams }, { data: trackers }, { data: org }] =
    await Promise.all([
      supabase.from("stores").select("id, host, client"),
      supabase
        .from("scans")
        .select(
          "id, url, status, consent_banner, policy_state, cookies, requests, created_at, store_id, failure, findings"
        )
        .order("created_at", { ascending: false })
        .limit(READINGS),
      supabase.from("trackers").select("name, cookie_pattern, host_pattern"),
      supabase.from("organizations").select("name").maybeSingle(),
    ]);

  const summary = summarise(stores ?? [], (exams ?? []) as Exam[]);

  return (
    <AppShell
      active="/painel"
      crumbs={<strong className="font-medium text-foreground">Painel</strong>}
    >
      {summary.length === 0 ? (
        <FirstStore erro={params.erro} />
      ) : (
        <Stores
          rows={await rowsOf(
            summary,
            stores ?? [],
            (trackers ?? []) as Tracker[]
          )}
          organization={org?.name ?? "Painel"}
          params={params}
        />
      )}
    </AppShell>
  );
}

/**
 * As linhas da lista, com a nota de cada loja.
 *
 * A nota precisa do texto da política, e esse é o campo mais pesado da tabela —
 * um documento inteiro por leitura. Buscá-lo junto das quinhentas leituras acima
 * traria megabytes para calcular quarenta números, então ele vem numa segunda
 * ida, só para as leituras que a lista realmente mostra.
 */
async function rowsOf(
  summary: StoreSummary[],
  stores: { id: string; client?: string | null }[],
  trackers: Tracker[]
): Promise<AgencyRow[]> {
  const latestDone = summary
    .map(({ latest }) => (latest.status === "done" ? latest.id : null))
    .filter((id): id is string => id !== null);

  const supabase = await createClient();
  const { data: policies } = latestDone.length
    ? await supabase
        .from("scans")
        .select("id, policy_text")
        .in("id", latestDone)
    : { data: [] };

  const textOf = new Map(
    (policies ?? []).map(({ id, policy_text }) => [id, policy_text])
  );

  const clientOf = new Map(stores.map((s) => [s.id, s.client ?? null]));

  return summary.map(({ id, host, exams, latest }) => ({
    id,
    host,
    client: clientOf.get(id) ?? null,
    exams,
    findings: latest.status === "done" ? (latest.findings?.length ?? 0) : 0,
    score:
      latest.status === "done"
        ? scoreOf({ ...latest, policy_text: textOf.get(latest.id) }, trackers)
            .value
        : null,
    beforeConsent:
      latest.status === "done"
        ? trackersIn(latest, "pre-consent", trackers).length
        : null,
    readAt: latest.created_at,
    failure: latest.status === "failed" ? (latest.failure ?? null) : null,
  }));
}

function FirstStore({ erro }: { erro?: string }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
          Bem-vindo ao bugsniff
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua organização foi criada quando você clicou no link. Falta a
          primeira loja.
        </p>
      </div>

      <Card className="items-center gap-5 px-6 py-14 text-center">
        <Mark size="lg" className="size-12 rounded-2xl">
          <IconScan size={24} stroke={2} />
        </Mark>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-medium">Examine a primeira loja</h2>
          <p className="max-w-[420px] text-sm text-muted-foreground">
            Cole o endereço e o exame começa na hora. Não precisa conectar nada,
            instalar nada, nem falar com ninguém.
          </p>
        </div>

        <NewScan erro={erro} label="Examinar" className="w-[440px]" />
      </Card>

      <div className="flex flex-col gap-5 md:flex-row">
        {NEXT.map(({ title, body }) => (
          <Card key={title} size="sm" className="flex-1 gap-2 px-4">
            <h2 className="text-sm text-muted-foreground">{title}</h2>
            <p className="text-sm">{body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

const NEXT = [
  {
    title: "Depois do primeiro exame",
    body: "Você vê o que a loja gravou antes de perguntar qualquer coisa, com o nome de cada serviço.",
  },
  {
    title: "Documentos",
    body: "A política de privacidade sai da leitura da sua loja, citando os serviços que ela realmente usa.",
  },
  {
    title: "Banner",
    body: "A lista de bloqueio nasce do exame: são os rastreadores encontrados nesta loja, não uma lista genérica.",
  },
] as const;

/**
 * As lojas desta organização, agrupadas, ordenadas e recortadas.
 *
 * Lojas, não leituras. Uma loja examinada cinco vezes é uma loja com histórico,
 * e uma lista que a repete cinco vezes não consegue dizer uma frase verdadeira
 * sobre como ela mudou.
 */
function Stores({
  rows,
  organization,
  params,
}: {
  rows: AgencyRow[];
  organization: string;
  params: Params;
}) {
  const sort = isSort(params.ordenar) ? params.ordenar : "exame";
  const descending = params.dir !== "asc";
  const band = isBand(params.faixa) ? params.faixa : undefined;
  const client = params.cliente;

  const shown = applyView(rows, { sort, descending, client, band });
  const groups = groupByClient(shown);
  const clients = clientsOf(rows);

  // A agência começa aqui. Abaixo disto a tela não tem o que agrupar nem o que
  // comparar, e as ferramentas só ocupariam espaço na frente da resposta.
  const many = rows.length > 1;

  const notice = params.lote
    ? (NOTICES[params.lote] ??
      `${params.lote} ${params.lote === "1" ? "exame enfileirado" : "exames enfileirados"}. Eles vão aparecendo aqui conforme terminam.`)
    : params.erro
      ? NOTICES[params.erro]
      : null;

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
            {organization}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 1 ? "1 loja" : `${rows.length} lojas`}
            {clients.length > 0 &&
              `, ${clients.length === 1 ? "1 cliente" : `${clients.length} clientes`}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {many && (
            <form action={scanAll}>
              <SubmitButton
                working="Enfileirando…"
                className={buttonVariants({ variant: "outline" })}
              >
                <IconRefresh size={14} stroke={2} /> Examinar todas
              </SubmitButton>
            </form>
          )}
          <NewScan erro={params.erro} label="Novo exame" />
        </div>
      </div>

      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      {many && <Filters clients={clients} params={params} />}

      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-1 px-6 py-5">
          <span className="font-heading text-base font-medium">Lojas</span>
          <span className="text-xs text-muted-foreground">
            O que cada loja acionou antes de perguntar qualquer coisa
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column.key}>
                    <SortLink
                      column={column}
                      sort={sort}
                      descending={descending}
                      params={params}
                    />
                  </TableHead>
                ))}
                <TableHead>Antes do consentimento</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma loja neste recorte.
                  </TableCell>
                </TableRow>
              )}

              {groups.map(({ client: name, rows: group }) => (
                <Fragment key={name ?? "__sem__"}>
                  {/* O cabeçalho de grupo só aparece quando existe cliente
                      nomeado. Um lojista de uma loja só nunca preenche isto, e
                      não deve ganhar um cabeçalho sobre uma distinção que não
                      existe no negócio dele. */}
                  {name && groups.length > 1 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={7}
                        className="bg-muted/40 py-2 text-xs font-medium"
                      >
                        {name}
                      </TableCell>
                    </TableRow>
                  )}

                  {group.map((row) => (
                    <StoreRow key={row.id} row={row} />
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}

/**
 * O recorte, como links e não como formulário.
 *
 * Tudo aqui é estado de URL: o recorte que alguém montou é um link que ela pode
 * mandar para a colega, e a tela continua funcionando com o JavaScript
 * desligado. Um seletor com estado no cliente custaria as duas coisas.
 */
function Filters({ clients, params }: { clients: string[]; params: Params }) {
  const chip = (active: boolean) =>
    `rounded-4xl border px-3 py-1 text-xs ${
      active
        ? "border-foreground/20 bg-accent text-accent-foreground"
        : "border-foreground/10 text-muted-foreground hover:text-foreground"
    }`;

  const href = (over: Partial<Params>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...over })) {
      if (value && key !== "erro" && key !== "lote") next.set(key, value);
    }
    const query = next.toString();
    return query ? `/painel?${query}` : "/painel";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Pontuação</span>
        <Link href={href({ faixa: undefined })} className={chip(!params.faixa)}>
          Todas
        </Link>
        {Object.entries(BANDS).map(([key, { label }]) => (
          <Link
            key={key}
            href={href({ faixa: key })}
            className={chip(params.faixa === key)}
          >
            {label}
          </Link>
        ))}
      </div>

      {clients.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Cliente</span>
          <Link
            href={href({ cliente: undefined })}
            className={chip(!params.cliente)}
          >
            Todos
          </Link>
          {clients.map((name) => (
            <Link
              key={name}
              href={href({ cliente: name })}
              className={chip(params.cliente === name)}
            >
              {name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Um cabeçalho que ordena, e diz em que direção está. */
function SortLink({
  column,
  sort,
  descending,
  params,
}: {
  column: { key: Sort; label: string };
  sort: Sort;
  descending: boolean;
  params: Params;
}) {
  const active = sort === column.key;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "erro" && key !== "lote") next.set(key, value);
  }
  next.set("ordenar", column.key);
  // Clicar na coluna ativa inverte; clicar numa nova começa pela ordem que
  // responde à pergunta — do maior para o menor, que é como se procura problema.
  next.set("dir", active && descending ? "asc" : "desc");

  return (
    <Link
      href={`/painel?${next}`}
      className={active ? "text-foreground" : "hover:text-foreground"}
    >
      {column.label}
      {active && (
        <span className="ml-1 text-muted-foreground">
          {descending ? "↓" : "↑"}
        </span>
      )}
    </Link>
  );
}

/**
 * Uma loja, como a leitura mais recente a deixa.
 *
 * Uma leitura que não aconteceu não mostra número nenhum: "nenhum rastreador"
 * sobre uma página que nunca foi a loja é a forma mais lisonjeira possível de
 * estar errado (#34).
 */
function StoreRow({ row }: { row: AgencyRow }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.host}</TableCell>

      <TableCell>
        {/* Editável no lugar, porque nomear o cliente de quarenta lojas numa
            tela separada é quarenta idas e voltas. */}
        <form action={nameClient} className="flex items-center gap-1">
          <input type="hidden" name="store" value={row.id} />
          <Input
            name="client"
            defaultValue={row.client ?? ""}
            placeholder="—"
            aria-label={`Cliente de ${row.host}`}
            className="h-7 w-32 border-transparent bg-transparent px-2 text-xs hover:border-input focus:border-input"
          />
          <SubmitButton
            working="…"
            className={buttonVariants({ variant: "ghost", size: "xs" })}
          >
            Salvar
          </SubmitButton>
        </form>
      </TableCell>

      <TableCell className="tabular-nums">
        {row.failure ? (
          <span className="text-muted-foreground">—</span>
        ) : row.findings === 0 ? (
          <span className="text-muted-foreground">nenhum</span>
        ) : (
          <Badge variant="outline">{row.findings}</Badge>
        )}
      </TableCell>

      <TableCell className="tabular-nums">
        {/* Sem cor, e é deliberado: o âmbar marca ação e o vermelho marca erro
            de sistema, e nenhuma cor conclui sobre conformidade (ADR-0005). O
            número já conclui o quanto o produto decidiu concluir. */}
        {row.score === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="font-medium">{row.score}</span>
        )}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {timeAgo(row.readAt)}
      </TableCell>

      <TableCell>
        <Before row={row} />
      </TableCell>

      <TableCell className="text-right">
        <Link
          href={`/loja/${row.id}`}
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          Abrir
        </Link>
      </TableCell>
    </TableRow>
  );
}

/**
 * Quantos serviços a loja acionou antes de perguntar qualquer coisa.
 *
 * O número que este produto existe para poder escrever. Uma leitura que não
 * aconteceu não mostra número nenhum, e sim o motivo: "nenhum rastreador" sobre
 * uma página que nunca foi a loja é a forma mais lisonjeira possível de estar
 * errado (#34).
 */
function Before({ row }: { row: AgencyRow }) {
  if (row.failure) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="destructive">
          <IconAlertCircle size={12} stroke={2} /> não medido
        </Badge>
        <span className="text-xs text-muted-foreground">
          {failureShort(row.failure)}
        </span>
      </div>
    );
  }

  if (row.beforeConsent === null)
    return <span className="text-muted-foreground">—</span>;

  return row.beforeConsent === 0 ? (
    <span className="text-muted-foreground">nenhum</span>
  ) : (
    <Badge>
      {row.beforeConsent === 1
        ? "1 rastreador"
        : `${row.beforeConsent} rastreadores`}
    </Badge>
  );
}
