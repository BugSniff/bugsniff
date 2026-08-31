import { IconAlertCircle, IconMail } from "@tabler/icons-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/packages/supabase/server";
import { refusalHeading, sendFailure, sendMessage, showAddress } from "./copy";
import { SubmitButton } from "../submit-button";

/**
 * Sends the link that is the only way in.
 *
 * There is no password anywhere in this app. `signInWithOtp` signs in an
 * existing account and creates one that does not exist yet, so entering and
 * signing up are the same act and the same field — and the trigger on
 * `auth.users` gives a new person their organization on the way through.
 */
async function sendLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");

  // Taken from the request so localhost, previews and production each send a
  // link back to themselves.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  // A code, not Supabase's own sentence: what goes in the URL comes back out
  // on this page, and a message passed through would let anyone craft a link
  // that makes the login screen say whatever they like.
  if (error) redirect(`/login?erro=${sendFailure(error.code ?? "")}`);
  redirect(`/login?enviado=${encodeURIComponent(email)}`);
}

/** The public funnel is a column, centred, with nothing else on the screen. */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-10">
      {children}
    </main>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string; expirado?: string }>;
}) {
  const { erro, enviado, expirado } = await searchParams;

  // Someone already signed in has nothing to do here, and sending them a link
  // to prove what the session already proves only spends quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  // Three screens, not three notices inside one form. Each is a different
  // moment: asking, having asked, and finding that the link no longer works.
  if (enviado !== undefined) return <LinkSent to={enviado} />;
  if (expirado !== undefined) return <LinkExpired refusal={expirado} />;

  return (
    <Centered>
      <Card className="w-[420px] gap-4 px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold">Entrar no bugsniff</h1>
          <p className="text-sm text-muted-foreground">
            Sem senha. Mandamos um link para o seu e-mail e ele é a sua entrada.
          </p>
        </div>

        <form action={sendLink} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {sendMessage(erro)}
            </p>
          )}

          <SubmitButton
            working="Enviando…"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Mandar o link
          </SubmitButton>
        </form>

        <p className="text-xs text-muted-foreground">
          Quem ainda não tem conta entra pelo mesmo campo: o primeiro link cria
          a organização.
        </p>
      </Card>
    </Centered>
  );
}

/**
 * The person is about to leave for somewhere that is not ours.
 *
 * Which is the whole reason this is a screen of its own and not a line above
 * the form: the next thing they do happens in their inbox, and a notice
 * stacked on top of a form they already submitted invites them to submit it
 * again — two links in the inbox, and no way to tell which one is theirs.
 */
function LinkSent({ to }: { to: string }) {
  return (
    <Centered>
      <Card className="w-[460px] items-start gap-4 px-6">
        <Mark size="lg">
          <IconMail size={20} stroke={2} />
        </Mark>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Link enviado</h1>
          <p className="text-sm text-muted-foreground">
            Abra seu e-mail e clique no link para entrar. Ele vale por pouco
            tempo e só funciona uma vez.
          </p>
        </div>

        {showAddress(to) && (
          <>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-xs">Enviado para</span>
              <span className="font-mono text-xs text-muted-foreground">
                {to}
              </span>
            </div>
          </>
        )}

        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Pedir outro link
        </Link>
      </Card>
    </Centered>
  );
}

/**
 * A link that no longer works, said as a fact about the link.
 *
 * Not "algo deu errado": expiry and single use are how the link is supposed to
 * behave, and a person who reads why it stopped working knows they did nothing
 * wrong. The field is right here because the only thing to do about it is ask
 * for another one.
 *
 * The red is one of the two places it may appear — a link that no longer opens
 * is our own machinery failing the person, not a reading of their store
 * (ADR-0005).
 */
function LinkExpired({ refusal }: { refusal: string }) {
  return (
    <Centered>
      <Card className="w-[460px] items-start gap-4 px-6">
        <Mark size="lg" className="bg-destructive/10 text-destructive">
          <IconAlertCircle size={20} stroke={2} />
        </Mark>

        <div className="flex flex-col gap-2">
          <h1 role="alert" className="text-xl font-semibold">
            {refusalHeading(refusal)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Um link de entrada vale por uma hora e por um clique só. Se você já
            tinha aberto ele antes, ou se pediu outro depois, este aqui deixou
            de valer.
          </p>
        </div>

        <form action={sendLink} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
            />
          </div>

          <SubmitButton
            working="Enviando…"
            className={buttonVariants({ className: "w-full" })}
          >
            Mandar um link novo
          </SubmitButton>
        </form>
      </Card>
    </Centered>
  );
}
