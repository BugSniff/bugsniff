import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type {
  ConsentBannerState,
  ConsentPhase,
  ScanRejection,
} from "@/packages/scan/scan";
import { createClient } from "@/packages/supabase/server";
import { Watch } from "./watch";

/** Why a scan came back empty-handed, in words the person can act on. */
const FAILURES: Record<ScanRejection, string> = {
  malformed: "O endereço não pôde ser lido.",
  "unsupported-scheme": "Só examinamos endereços http e https.",
  "unsupported-port": "Só examinamos endereços nas portas padrão.",
  unresolvable: "Não encontramos esse endereço.",
  "private-address": "Esse endereço não é público.",
  unreachable: "A loja não respondeu a tempo. Pode estar fora do ar.",
};

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
      "id, url, status, cookies, consent_banner, consent_platform, evidence_path, failure"
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

  // The screenshot is guarded by the same rule as the scan, so asking for a
  // link to it is asking the same question again — and getting the same answer.
  const { data: evidence } = scan.evidence_path
    ? await supabase.storage
        .from("scan-evidence")
        .createSignedUrl(scan.evidence_path, EVIDENCE_LINK_SECONDS)
    : { data: null };

  return (
    <main className="mx-auto flex flex-1 w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      {waiting && <Watch scanId={scan.id} />}

      <div>
        <h1 className="text-2xl font-semibold">bugsniff</h1>
        <p className="mt-1 text-sm text-zinc-500">{scan.url}</p>
      </div>

      {waiting && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          {scan.status === "running"
            ? "Abrindo a loja num navegador de verdade…"
            : "Na fila. Começa assim que uma vaga abrir."}{" "}
          Esta página se atualiza sozinha.
        </p>
      )}

      {scan.status === "failed" && (
        <p role="alert" className="text-sm text-red-600">
          {FAILURES[scan.failure as ScanRejection] ??
            "O exame não pôde ser concluído."}
        </p>
      )}

      {scan.status === "done" && (
        <>
          <BannerNote
            state={scan.consent_banner}
            platform={scan.consent_platform}
          />
          <Cookies
            cookies={scan.cookies as Cookie[]}
            consentBanner={scan.consent_banner}
          />
          {evidence && <Evidence url={evidence.signedUrl} />}
        </>
      )}

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          Examinar outra loja
        </Link>
      </p>
    </main>
  );
}

function Cookies({
  cookies,
  consentBanner,
}: {
  cookies: Cookie[];
  /** Null on scans read before the store was read in two states. */
  consentBanner: ConsentBannerState | null;
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
 * What the scan can honestly say about the banner.
 *
 * The distinction this paragraph exists for: "nosso navegador não encontrou"
 * is an observation of ours, and the picture below lets anyone check it.
 * "Esta loja não tem banner" would be an assertion about the store, and that
 * one does not get made without a human having looked.
 */
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

function Evidence({ url }: { url: string }) {
  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="A loja como nosso navegador a viu, antes de qualquer interação"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
      />
      <figcaption className="text-xs text-zinc-500">
        A loja no momento da leitura, antes de qualquer interação. A imagem não
        mostra cookies: ela mostra a tela em que os cookies acima já estavam
        gravados.
      </figcaption>
    </figure>
  );
}
