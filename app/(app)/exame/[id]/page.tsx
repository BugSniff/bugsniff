import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type {
  ConsentBannerState,
  ConsentPhase,
  PolicyReading,
  ScanRejection,
} from "@/packages/scan/scan";
import { EVIDENCE_BUCKET } from "@/packages/evidence";
import type { Finding } from "@/packages/finding-validator";
import { registrableDomain } from "@/packages/scan/third-party";
import {
  nameCookie,
  nameHost,
  namedTrackers,
  type Tracker,
} from "@/packages/tracker";
import { createClient } from "@/packages/supabase/server";
import { IconFileText } from "@tabler/icons-react";
import { AppShell } from "@/components/app-shell";
import { ScoreCard } from "@/components/score-card";
import { Card } from "@/components/ui/card";
import { scoreOf } from "@/lib/score";
import { buttonVariants } from "@/components/ui/button";
import { canonicalHost } from "@/lib/store";
import { Watch } from "./watch";

/** Why a scan came back empty-handed, in words the person can act on. */
const FAILURES: Record<ScanRejection, string> = {
  malformed: "O endereço não pôde ser lido.",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço.",
  "private-address": "Esse endereço não é público.",
  unreachable: "A loja não respondeu a tempo. Pode estar fora do ar.",
  blocked:
    "A loja respondeu ao nosso navegador com uma página de erro, não com a loja. Não é um exame limpo: é um exame que não aconteceu.",
};

/** A third party the store talked to. */
type Request = { host: string; phase: ConsentPhase };

/** `phase` is absent on scans read before the two states existed. */
type Cookie = {
  name: string;
  domain: string;
  expires: number;
  phase?: ConsentPhase;
};

const PHASES: Record<ConsentPhase, string> = {
  "pre-consent": "antes do consentimento",
  "post-consent": "depois do consentimento",
};

/** Long enough to look at the picture, short enough to not be a public link. */
const EVIDENCE_LINK_SECONDS = 300;

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RLS does the authorisation. A scan belonging to another organization is not
  // forbidden here, it is invisible — so there is nothing to leak by asking.
  const supabase = await createClient();
  const { data: scan } = await supabase
    .from("scans")
    .select(
      "id, url, status, cookies, requests, consent_banner, consent_platform, policy_state, policy_url, policy_text, evidence_pre_path, evidence_post_path, failure, findings"
    )
    .eq("id", id)
    .maybeSingle();

  if (!scan) notFound();

  const waiting = scan.status === "pending" || scan.status === "running";

  // Whoever is waiting is the sweeper.
  //
  // The chain normally hands each scan to the next, but a function that dies
  // mid-scan breaks it and leaves the queue standing still. Rather than a cron
  // sweeping for orphans on a schedule, the person looking at a scan that has
  // not started nudges the queue themselves — which is exactly when it matters
  // and never when it does not. A scan nobody is waiting for can wait.
  if (scan.status === "pending") {
    const origin = (await headers()).get("origin");
    after(() =>
      fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
        // Another visit will try again.
      })
    );
  }

  // The screenshots are guarded by the same rule as the scan, so asking for
  // links is asking the same question again — and getting the same answer.
  const link = async (path: string | null) =>
    path
      ? ((
          await supabase.storage
            .from(EVIDENCE_BUCKET)
            .createSignedUrl(path, EVIDENCE_LINK_SECONDS)
        ).data?.signedUrl ?? null)
      : null;

  const [beforeShot, afterShot] = await Promise.all([
    link(scan.evidence_pre_path),
    link(scan.evidence_post_path),
  ]);

  const cookies = (scan.cookies ?? []) as Cookie[];
  const requests = (scan.requests ?? []) as Request[];

  // Which service wrote which cookie. Read at render time, not written into the
  // scan, so a name added to the table today names the cookies of a scan taken
  // last week — which is the point of keeping the list as data.
  const { data: trackers } = await supabase
    .from("trackers")
    .select("name, cookie_pattern, host_pattern");

  // The pre-consent state is written the moment the browser has it, so there
  // is a real reading to show while the second one is still being taken.
  const reading = waiting && cookies.length > 0;

  return (
    <AppShell
      active="/painel"
      actions={
        scan.status === "done" ? (
          <Link
            href={`/exame/${scan.id}/relatorio`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconFileText size={14} stroke={2} /> Relatório
          </Link>
        ) : null
      }
      crumbs={
        <>
          <Link href="/painel" className="hover:text-foreground">
            Painel
          </Link>
          <span>/</span>
          <strong className="font-medium text-foreground">
            {canonicalHost(scan.url)}
          </strong>
        </>
      }
    >
      {waiting && <Watch scanId={scan.id} />}

      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="font-mono text-xl font-semibold">
            {canonicalHost(scan.url)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{scan.url}</p>
        </div>

        {waiting && (
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            {scan.status === "pending"
              ? "Na fila. Começa assim que uma vaga abrir."
              : reading
                ? "Esta é a loja antes de qualquer interação. Agora respondendo ao banner, para ver o que muda depois do consentimento…"
                : "Abrindo a loja num navegador de verdade…"}{" "}
            Esta página se atualiza sozinha.
          </p>
        )}

        {scan.status === "failed" && (
          <>
            <p role="alert" className="text-sm text-red-600">
              {FAILURES[scan.failure as ScanRejection] ??
                "O exame não pôde ser concluído."}
            </p>
            {beforeShot && (
              <Shot
                url={beforeShot}
                title="A tela que nosso navegador recebeu"
                detail="no lugar da loja"
                alt="A página de erro que a loja devolveu ao nosso navegador"
              />
            )}
          </>
        )}

        {(scan.status === "done" || reading) && (
          <>
            <BannerNote
              state={scan.consent_banner}
              platform={scan.consent_platform}
            />
            {scan.status === "done" && (
              <Card className="px-6">
                <ScoreCard
                  score={scoreOf(scan, (trackers ?? []) as Tracker[])}
                />
              </Card>
            )}
            <Findings findings={(scan.findings ?? []) as Finding[]} />
            <BeforeConsent
              cookies={cookies}
              requests={requests}
              trackers={trackers ?? []}
            />
            <Cookies
              cookies={cookies}
              consentBanner={scan.consent_banner}
              trackers={trackers ?? []}
            />
            <Requests
              requests={requests}
              consentBanner={scan.consent_banner}
              trackers={trackers ?? []}
            />
            <Policy state={scan.policy_state} url={scan.policy_url} />
            <Timeline
              cookies={cookies}
              beforeShot={beforeShot}
              afterShot={afterShot}
            />
          </>
        )}

        <p className="text-sm text-zinc-500">
          <Link href="/painel" className="underline">
            Voltar ao painel
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

function Cookies({
  cookies,
  consentBanner,
  trackers,
}: {
  cookies: Cookie[];
  /** Null on scans read before the store was read in two states. */
  consentBanner: ConsentBannerState | null;
  trackers: Tracker[];
}) {
  // Two states to compare only where a banner was actually answered. Anything
  // else has one reading: either nothing asked, or we could not answer it.
  const twoStates = consentBanner === "accepted";
  const before = cookies.filter((c) => c.phase !== "post-consent");
  const after = cookies.length - before.length;

  if (cookies.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {twoStates
          ? "Nenhum cookie foi gravado nesta loja, nem antes nem depois do consentimento."
          : "Nenhum cookie foi gravado ao abrir esta loja."}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
        {twoStates
          ? `${before.length} cookies antes do consentimento, ${after} depois de aceitar o banner`
          : `${cookies.length} cookies gravados`}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Nome
              </th>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Rastreador
              </th>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Domínio
              </th>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Duração
              </th>
              {twoStates && (
                <th className="border-b border-zinc-200 py-2 font-normal dark:border-zinc-800">
                  Momento
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie) => (
              <tr key={`${cookie.domain}${cookie.name}`}>
                <td className="border-b border-zinc-100 py-2 pr-4 font-mono text-xs dark:border-zinc-900">
                  {cookie.name}
                </td>
                <td className="border-b border-zinc-100 py-2 pr-4 dark:border-zinc-900">
                  {nameCookie(cookie.name, trackers) ?? (
                    <span className="text-zinc-400">não identificado</span>
                  )}
                </td>
                <td className="border-b border-zinc-100 py-2 pr-4 text-zinc-500 dark:border-zinc-900">
                  {cookie.domain}
                </td>
                <td className="border-b border-zinc-100 py-2 pr-4 text-zinc-500 dark:border-zinc-900">
                  {cookie.expires === -1
                    ? "até fechar o navegador"
                    : "persistente"}
                </td>
                {twoStates && (
                  <td className="border-b border-zinc-100 py-2 text-zinc-500 dark:border-zinc-900">
                    {PHASES[cookie.phase ?? "pre-consent"]}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * The line this whole product exists to be able to write.
 *
 * A tracker is a cookie *or* a request to a third party (CONTEXT.md), and both
 * halves count here: the same service is one service, whichever way it showed
 * itself. A store that fires a pixel by image writes no cookie at all, and
 * before requests were observed it came back with nothing to report.
 */
function BeforeConsent({
  cookies,
  requests,
  trackers,
}: {
  cookies: Cookie[];
  requests: Request[];
  trackers: Tracker[];
}) {
  const before = {
    cookies: cookies.filter((c) => c.phase !== "post-consent"),
    requests: requests.filter((r) => r.phase !== "post-consent"),
  };

  const named = namedTrackers(before, trackers);

  // The third parties we cannot put a name to, counted by who they are rather
  // than by how many addresses they answer on. Kept in the sentence on purpose:
  // the gap is ours, and hiding it would make the reading look more complete
  // than it is.
  const unnamed = new Set(
    before.requests
      .filter((r) => !nameHost(r.host, trackers))
      .map((r) => registrableDomain(r.host))
  );

  const others =
    unnamed.size > 0
      ? `${unnamed.size} ${unnamed.size === 1 ? "outro terceiro que não sabemos nomear" : "outros terceiros que não sabemos nomear"}`
      : null;

  if (named.length === 0 && !others) return null;

  return (
    <p className="text-sm">
      Antes de qualquer interação com o banner, esta loja acionou{" "}
      {named.length > 0 && (
        <strong className="font-medium">{named.join(", ")}</strong>
      )}
      {named.length > 0 && others ? ", e mais " : ""}
      {others}.
    </p>
  );
}

/**
 * Who the store talked to, other than itself.
 *
 * Everything is listed, named or not. A host we cannot name is not nothing —
 * it is a third party that saw the visitor arrive, and dropping it because our
 * table is incomplete would be hiding our own gap in somebody else's report.
 */
function Requests({
  requests,
  consentBanner,
  trackers,
}: {
  requests: Request[];
  consentBanner: ConsentBannerState | null;
  trackers: Tracker[];
}) {
  if (requests.length === 0) return null;

  const twoStates = consentBanner === "accepted";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-zinc-600 dark:text-zinc-400">
        {requests.length} terceiros contactados
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Endereço
              </th>
              <th className="border-b border-zinc-200 py-2 pr-4 font-normal dark:border-zinc-800">
                Rastreador
              </th>
              {twoStates && (
                <th className="border-b border-zinc-200 py-2 font-normal dark:border-zinc-800">
                  Momento
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={`${request.phase}${request.host}`}>
                <td className="border-b border-zinc-100 py-2 pr-4 font-mono text-xs dark:border-zinc-900">
                  {request.host}
                </td>
                <td className="border-b border-zinc-100 py-2 pr-4 dark:border-zinc-900">
                  {/* Without a name in the table, the domain is still an
                      identity: `track.titanpush.com` is titanpush.com, and
                      saying so beats "não identificado", which throws away
                      what we already know. Muted, because knowing who received
                      the data is not the same as knowing which product it is. */}
                  {nameHost(request.host, trackers) ?? (
                    <span className="text-zinc-500">
                      {registrableDomain(request.host)}
                    </span>
                  )}
                </td>
                {twoStates && (
                  <td className="border-b border-zinc-100 py-2 text-zinc-500 dark:border-zinc-900">
                    {PHASES[request.phase]}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * What the scan can honestly say about the banner.
 *
 * The distinction this paragraph exists for: "nosso navegador não encontrou"
 * is an observation of ours, and the picture below lets anyone check it.
 * "Esta loja não tem banner" would be an assertion about the store, and that
 * one does not get made without a human having looked.
 */
/**
 * The audit's output: what was observed, and the norm that addresses it.
 *
 * Read the shape carefully, because it is the product's whole legal posture.
 * There is a fact, there is an excerpt of the law, and there is nothing
 * joining them into a verdict — no "portanto", no severity, no colour that
 * means trouble. The reader is left holding both halves, which is the only
 * position we may leave them in: concluding about somebody's concrete case is
 * the advocacy's competence, not ours (ADR-0001).
 *
 * Everything here already passed the validator before it was written to the
 * scan. This component only renders.
 */
function Findings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">
        {findings.length === 1 ? "1 achado" : `${findings.length} achados`}
      </h2>

      <ol className="flex flex-col gap-4">
        {findings.map((finding, index) => (
          <li
            key={index}
            className="border-l-2 border-amber-500 pl-4 flex flex-col gap-2"
          >
            <p className="text-sm">{finding.observedFact}</p>
            <p className="text-xs text-zinc-500">{finding.evidence}</p>
            <figure className="flex flex-col gap-1">
              <blockquote className="text-xs text-zinc-600 dark:text-zinc-400">
                “{finding.normExcerpt}”
              </blockquote>
              <figcaption className="text-xs text-zinc-500">
                {finding.normCitation}
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BannerNote({
  state,
  platform,
}: {
  state: ConsentBannerState | null;
  platform: string | null;
}) {
  if (!state || state === "accepted") return null;

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {state === "unrecognised"
        ? `${platform ? `Encontramos ${platform} nesta loja` : "Esta loja usa uma plataforma de consentimento"}, mas nosso navegador não conseguiu responder ao banner. As leituras abaixo são de antes de qualquer interação.`
        : "Nosso navegador não encontrou banner de consentimento nesta loja. Abaixo está o que ele viu."}
    </p>
  );
}

/**
 * What the store says it does, and where it says it.
 *
 * The wording of the not-found case is the point of this whole component.
 * "Não encontramos" is about us; "esta loja não tem política" would be about
 * the store, and we have no standing to say that — the link may be behind a
 * menu, in an image, or on a page we never opened.
 */
function Policy({
  state,
  url,
}: {
  state: PolicyReading["state"] | null;
  url: string | null;
}) {
  if (!state) return null;

  if (state === "found") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Política de privacidade publicada em{" "}
        <a href={url ?? "#"} className="underline" rel="nofollow noreferrer">
          {url}
        </a>
        .
      </p>
    );
  }

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {state === "unreadable"
        ? "Encontramos um link para a política de privacidade, mas não conseguimos ler o que ele abre."
        : "Não encontramos a política de privacidade a partir da home desta loja."}{" "}
      <span className="text-zinc-500">
        Isso não quer dizer que ela não exista: quer dizer que o nosso navegador
        não chegou nela.
      </span>
    </p>
  );
}

/**
 * The store's own screen at each reading, next to what it had written by then.
 *
 * The pairing is what carries the weight, and the caption is careful about
 * which half says what: the picture cannot show a cookie, because cookies are
 * invisible. It shows the screen the visitor was looking at while the cookies
 * listed above were already on their machine.
 */
function Timeline({
  cookies,
  beforeShot,
  afterShot,
}: {
  cookies: Cookie[];
  beforeShot: string | null;
  afterShot: string | null;
}) {
  if (!beforeShot) return null;

  const before = cookies.filter((c) => c.phase !== "post-consent").length;
  const after = cookies.length - before;

  return (
    <section className="flex flex-col gap-6">
      <Shot
        url={beforeShot}
        title="Antes de qualquer clique"
        detail={`${before} cookies já gravados`}
        alt="A loja como nosso navegador a viu, antes de qualquer interação"
      />

      {afterShot && (
        <Shot
          url={afterShot}
          title="Depois de aceitar o banner"
          detail={after > 0 ? `mais ${after} cookies` : "nenhum cookie novo"}
          alt="A loja depois de o exame aceitar o banner de consentimento"
        />
      )}
    </section>
  );
}

function Shot({
  url,
  title,
  detail,
  alt,
}: {
  url: string;
  title: string;
  detail: string;
  alt: string;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm text-zinc-600 dark:text-zinc-400">
        {title} <span className="text-zinc-500">· {detail}</span>
      </figcaption>
      {/* The browser reads at 1280x720, and reserving that ratio keeps the
          picture from shoving the page around when it finally lands. */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="w-full" />
      </div>
    </figure>
  );
}
