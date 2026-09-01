"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useDeferredValue, useMemo, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Blocklist } from "@/packages/consent-banner/blocklist";
import { previewPage } from "@/packages/consent-banner/preview";
import {
  DEFAULT_SETTINGS,
  settingsFrom,
  type ConsentBannerSettings,
} from "@/packages/consent-banner/settings";
import { bannerSnippet } from "@/packages/consent-banner/snippet";
import { saveBannerSettings } from "./settings-action";

/**
 * Where the banner is written, looked at, and taken away.
 *
 * The three are one component because the preview has to be of the thing being
 * taken away, not of a drawing of it: it runs the very code the code block
 * below shows, generated from the same settings in the same breath. A mock
 * would drift, and it would drift silently — somebody would approve wording and
 * colours here and install something that does not match.
 *
 * Generating in the browser is what makes that possible. `bannerSnippet` is
 * plain TypeScript over data already on this page, so a keystroke updates both
 * halves without a round trip; saving is a separate act, and unsaved wording
 * still previews.
 */
export function BannerStudio({
  storeId,
  host,
  blocklist,
  settings,
}: {
  storeId: string;
  host: string;
  blocklist: Blocklist;
  settings: ConsentBannerSettings;
}) {
  const [draft, setDraft] = useState(settings);

  // The preview reloads its frame on every change, so it follows a deferred
  // copy of the draft: typing stays typing, and the frame catches up when the
  // keystrokes stop.
  const shown = useDeferredValue(draft);

  const snippet = useMemo(
    () => bannerSnippet(blocklist, settingsFrom(shown)),
    [blocklist, shown]
  );

  const preview = useMemo(() => previewPage(snippet, host), [snippet, host]);

  const text = (field: keyof ConsentBannerSettings["text"], value: string) =>
    setDraft((current) => ({
      ...current,
      text: { ...current.text, [field]: value },
    }));

  const color = (field: keyof ConsentBannerSettings["colors"], value: string) =>
    setDraft((current) => ({
      ...current,
      colors: { ...current.colors, [field]: value },
    }));

  return (
    <>
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <form
          action={saveBannerSettings}
          className="flex min-w-0 flex-1 flex-col gap-5"
        >
          <input type="hidden" name="store" value={storeId} />

          <Card className="px-6">
            <span className="font-medium">Texto</span>

            {/* Emptied, a field falls back to our wording rather than to a
                blank button, and the placeholder is what says which. */}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">O que o banner diz</Label>
              <Input
                id="title"
                name="title"
                maxLength={160}
                placeholder={DEFAULT_SETTINGS.text.title}
                value={draft.text.title}
                onChange={(event) => text("title", event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="body">E o que ele explica</Label>
              <textarea
                id="body"
                name="body"
                rows={3}
                maxLength={400}
                placeholder={DEFAULT_SETTINGS.text.body}
                value={draft.text.body}
                onChange={(event) => text("body", event.target.value)}
                className="w-full rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["acceptAll", "Botão de aceite"],
                  ["rejectAll", "Botão de recusa"],
                  ["manage", "Botão de escolher"],
                ] as const
              ).map(([field, label]) => (
                <div
                  key={field}
                  className="flex min-w-[150px] flex-1 flex-col gap-1.5"
                >
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    name={field}
                    maxLength={40}
                    placeholder={DEFAULT_SETTINGS.text[field]}
                    value={draft.text[field]}
                    onChange={(event) => text(field, event.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* The rule the shop owner does not get a field for, said where they
                are editing the labels — otherwise the first request is to make
                the accept stand out, and the answer would arrive as a surprise. */}
            <p className="text-xs text-muted-foreground">
              Os três botões saem sempre do mesmo tamanho, peso e cor. Um banner
              com o aceite mais visível que a recusa é exatamente o achado que
              este produto escreve sobre a loja de outra pessoa.
            </p>
          </Card>

          <Card className="px-6">
            <span className="font-medium">Cores</span>
            <p className="text-sm text-muted-foreground">
              O banner mora na loja, não aqui: ele nasce preto no branco para
              não destoar de nada e é para ser mudado até parecer da loja.
            </p>

            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["background", "Fundo"],
                  ["foreground", "Texto"],
                  ["accent", "Botões"],
                  ["accentForeground", "Texto dos botões"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <Label htmlFor={field}>{label}</Label>
                  <span className="flex items-center gap-2">
                    <input
                      id={field}
                      name={field}
                      type="color"
                      value={draft.colors[field]}
                      onChange={(event) => color(field, event.target.value)}
                      className="size-9 shrink-0 cursor-pointer rounded-4xl border border-input bg-input/30 p-1"
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {draft.colors[field]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <SubmitButton working="Salvando…" className={buttonVariants()}>
              Salvar
            </SubmitButton>
            <span className="text-xs text-muted-foreground">
              Salvar guarda o texto e as cores. O código abaixo já está com o
              que está na tela.
            </span>
          </div>
        </form>

        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[380px]">
          <span className="text-sm font-medium">Como fica na loja</span>
          <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
            {/*
              The generated code, running. `allow-scripts` and nothing else: no
              same-origin, so the frame cannot reach this page, and cookies
              throw inside it — which is why the preview always shows the banner
              instead of remembering a click from a minute ago.
            */}
            <iframe
              title="Prévia do banner na loja"
              srcDoc={preview}
              sandbox="allow-scripts"
              className="h-[420px] w-full border-0 bg-white"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A prévia roda o mesmo código que você vai colar. A loja de fundo é
            de mentira; o banner não é.
          </p>
        </div>
      </div>

      <Snippet snippet={snippet} blocked={blocklist.blocked.length} />
    </>
  );
}

/**
 * The code, and what it cannot do.
 *
 * The two limits are on this screen and inside the generated file both, because
 * this is where somebody decides whether the banner is enough and that is where
 * they will be standing when they find out it was not.
 */
function Snippet({ snippet, blocked }: { snippet: string; blocked: number }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission, or an insecure origin. The block below is
      // selectable text either way, so there is nothing to tell anybody.
    }
  };

  return (
    <Card className="gap-4 px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium">O código</span>
          <span className="max-w-[640px] text-sm text-muted-foreground">
            Cole o mais alto possível dentro do <code>&lt;head&gt;</code> da
            loja, antes de qualquer outro script: o bloqueio vale para o que
            roda depois dele. Não depende de plataforma e não chama nada nosso —
            é o banner inteiro.
          </span>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <IconCheck size={14} stroke={2} />
          ) : (
            <IconCopy size={14} stroke={2} />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      <pre className="max-h-72 overflow-auto rounded-2xl bg-muted p-4 text-xs leading-relaxed">
        <code>{snippet}</code>
      </pre>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p className="max-w-[720px]">
          Para a pessoa poder mudar de ideia, ponha no rodapé da loja um link
          chamando <code>bugsniffConsent.open()</code>. Consentimento que não se
          revoga tão facilmente quanto se dá não era muito consentimento.
        </p>
        <p className="max-w-[720px]">
          Dois limites: cookie que o servidor da loja manda no cabeçalho da
          resposta não passa por este código, e tag de rastreador escrita à mão
          no tema é buscada pelo navegador antes de qualquer script rodar. Os
          dois se resolvem pela instalação via plataforma, que ainda não existe.
        </p>
        <p className="max-w-[720px]">
          Um exame novo pode encontrar rastreador novo. Quando encontrar, esta
          página gera o código de novo — e aí ele precisa ser colado de novo.
          {blocked === 0 &&
            " Hoje ele não bloqueia nada: o exame não encontrou rastreador nomeado nesta loja."}
        </p>
      </div>
    </Card>
  );
}
