import { IconCamera, IconScale, IconScan } from "@tabler/icons-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { LinkSent } from "@/components/link-sent";
import { scanRefusal } from "@/lib/copy";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseTargetUrl } from "@/packages/scan/target-url";
import { createAdminClient } from "@/packages/supabase/admin";
import { createClient } from "@/packages/supabase/server";
import { SubmitButton } from "./submit-button";

/** Nudges the queue after the response is sent, so nobody waits on a browser. */
async function kickQueue() {
  const origin = (await headers()).get("origin");
  after(() =>
    fetch(`${origin}/api/scan-worker`, { method: "POST" }).catch(() => {
      // The waiting screen tries again on its next render.
    })
  );
}

/**
 * Starts a scan.
 *
 * Two paths, and the only difference is whether the gate still has anything to
 * prove. The gate exists to establish that whoever asked owns the address they
 * typed — and a live session already established exactly that. Asking again is
 * friction that also spends a magic link to reconfirm something confirmed.
 *
 * Signed in, the scan is queued at once and the person goes straight to it.
 * Signed out, the scan is parked and clicking the link in the inbox releases it.
 */
async function requestScan(formData: FormData) {
  "use server";

  const target = await parseTargetUrl(String(formData.get("url") ?? ""));
  if (!target.ok) redirect(`/?erro=${target.reason}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // RLS scopes this to the caller, so it is always their own.
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .maybeSingle();

    if (!organization) redirect("/?erro=sem-organizacao");

    const { data: scan } = await createAdminClient()
      .from("scans")
      .insert({
        url: target.url.href,
        organization_id: organization.id,
        status: "pending",
        pending_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!scan) redirect("/?erro=nao-registrado");

    await kickQueue();
    redirect(`/exame/${scan.id}`);
  }

  // Nobody signed in: park the URL and let the inbox release it. The URL does
  // not travel inside the e-mail — a link the recipient could edit would point
  // the scan elsewhere with the gate already passed — so the link carries the
  // claim token and the URL stays in the row.
  const { data: parked } = await createAdminClient()
    .from("scans")
    .insert({ url: target.url.href })
    .select("claim_token")
    .single();

  if (!parked) redirect("/?erro=nao-registrado");

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email: String(formData.get("email") ?? ""),
    options: {
      emailRedirectTo: `${origin}/auth/callback?scan=${parked.claim_token}`,
    },
  });

  if (error) redirect("/?erro=nao-enviado");
  redirect(
    `/?enviado=${encodeURIComponent(String(formData.get("email") ?? ""))}`
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string }>;
}) {
  const { erro, enviado } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex w-full flex-col items-center gap-14 px-10 pt-18">
      <div className="flex max-w-[720px] flex-col items-center gap-5 text-center">
        <Badge variant="outline" className="h-6 px-2.5 text-[13px]">
          Auditoria de LGPD para loja virtual
        </Badge>
        <h1 className="text-[46px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
          Veja o que a sua loja grava no navegador de quem visita.
        </h1>
        <p className="max-w-[620px] text-[15px] leading-[1.6] text-pretty text-muted-foreground">
          O exame abre a loja num navegador de verdade, antes e depois do banner
          de consentimento, e mostra o que disparou em cada momento — ao lado da
          norma que trata disso.
        </p>
      </div>

      {enviado !== undefined ? (
        <LinkSent
          to={enviado}
          back={{ href: "/", label: "Examinar outra loja" }}
        >
          Abra seu e-mail e clique no link para ver o exame. Ele começa a rodar
          quando você clicar — nada sobe antes disso.
        </LinkSent>
      ) : (
        <Card className="w-[560px] gap-3.5 px-6">
          <form action={requestScan} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">Endereço da loja</Label>
              <Input
                id="url"
                type="text"
                name="url"
                required
                placeholder="loja.com.br"
              />
            </div>

            {!user && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Seu e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>
            )}

            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {scanRefusal(erro)}
              </p>
            )}

            <SubmitButton
              working={user ? "Começando…" : "Enviando o link…"}
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Examinar
            </SubmitButton>
          </form>

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Mandamos o resultado por um link no seu e-mail. Sem senha: o link
              é a sua entrada.
            </p>
          )}
        </Card>
      )}

      <div className="flex w-full max-w-[1060px] flex-col gap-5 md:flex-row">
        {PROMISES.map(({ icon: Icon, title, body }) => (
          <Card key={title} size="sm" className="flex-1 gap-2.5 px-4">
            <Icon size={20} stroke={2} className="text-sidebar-primary" />
            <h2 className="text-base font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>

      <SampleResult />
    </main>
  );
}

/** What the exam does, in three lines, before anyone has typed anything. */
const PROMISES = [
  {
    icon: IconScan,
    title: "Duas leituras da mesma loja",
    body: "Uma sem tocar em nada, outra depois de aceitar o banner. A diferença entre elas é o que a loja fez sem perguntar.",
  },
  {
    icon: IconScale,
    title: "Fato observado, norma citada",
    body: "Nunca uma conclusão sobre a sua situação jurídica. O relatório diz o que aconteceu e mostra o trecho da norma que trata daquilo.",
  },
  {
    icon: IconCamera,
    title: "Prova em imagem",
    body: "Cada leitura guarda o print da loja naquele instante — a tela que o visitante via enquanto os cookies já estavam gravados.",
  },
] as const;

/**
 * A result, shown before there is one to show.
 *
 * The store is `loja.exemplo.com.br` and the heading says it is an example,
 * deliberately: this table is the only place in the product where a reading is
 * made up rather than observed, and putting a real shop's name on invented
 * cookies would be publishing an audit we never ran about somebody who never
 * asked. The shape is real; the store is not.
 */
function SampleResult() {
  return (
    <section className="flex w-full max-w-[1060px] flex-col gap-3.5 pb-18">
      <h3 className="text-sm text-muted-foreground">
        Um resultado de exemplo, como ele aparece
      </h3>

      <Card className="gap-0 p-0">
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="font-heading font-mono text-base font-medium">
              loja.exemplo.com.br
            </span>
            <span className="text-xs text-muted-foreground">
              31 de agosto, 14h02 · banner aceito
            </span>
          </div>
          <Badge>7 rastreadores antes do consentimento</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cookie</TableHead>
              <TableHead>Rastreador</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Momento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE.map(({ cookie, tracker, domain, before }) => (
              <TableRow key={cookie}>
                <TableCell className="font-mono text-xs">{cookie}</TableCell>
                <TableCell>{tracker}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {domain}
                </TableCell>
                <TableCell>
                  <Badge variant={before ? "default" : "secondary"}>
                    {before
                      ? "antes do consentimento"
                      : "depois do consentimento"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

const SAMPLE = [
  {
    cookie: "_fbp",
    tracker: "Meta Pixel",
    domain: ".loja.exemplo.com.br",
    before: true,
  },
  {
    cookie: "_hjSessionUser_31",
    tracker: "Hotjar",
    domain: ".loja.exemplo.com.br",
    before: true,
  },
  {
    cookie: "_ga_8QK2ZP",
    tracker: "Google Analytics",
    domain: ".loja.exemplo.com.br",
    before: true,
  },
  {
    cookie: "IDE",
    tracker: "Google DoubleClick",
    domain: ".doubleclick.net",
    before: false,
  },
] as const;
