"use client";

import { IconCheck, IconScan } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { elapsed } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * The screen while the browser is still out there looking.
 *
 * It exists because of what it replaced: a single grey line saying "abrindo a
 * loja num navegador de verdade" on an otherwise empty page, for up to a minute
 * and a half. Nothing said what was happening, nothing said how long, and an
 * empty page that says nothing is indistinguishable from one that has broken.
 *
 * Four things carry that weight here, and none of them is decoration. A clock
 * that moves, because a number ticking is most of what tells somebody the page
 * is alive. A list of steps with the current one marked, because "what is it
 * doing" has a real answer we happen to know. A bar of the clock against the
 * ceiling, so the wait has an end somebody can see and not just read. And a
 * stated expectation of how long, which is the one the product had been
 * keeping to itself.
 */

/**
 * What the wait is likely to cost, and what it cannot exceed.
 *
 * Measured, not guessed. A quick store finishes in under half a minute; the
 * slowest one in the queue so far — smiles.com.br, whose document parses for
 * over a minute — takes ninety-three seconds. The ceiling is the invocation's
 * own: `maxDuration` on the worker is 180s, so three minutes is not an estimate
 * but the point at which the scan stops whether or not it is done.
 */
const SLOW_AFTER_SECONDS = 75;

/**
 * When the scan stops whether or not it is done.
 *
 * `maxDuration` on the worker, and therefore the one honest end of the bar:
 * not an estimate of when the reading will finish, but the moment after which
 * it will not be running at all.
 */
const CEILING_SECONDS = 180;

/**
 * The steps, in the order they happen.
 *
 * Two names each, and not by accident: `label` is what the list of steps shows
 * and `title` is what the card leads with. One string in both places reads as a
 * bug — the same sentence twice, once bold and once in a list.
 */
const STEPS = [
  {
    key: "queue",
    label: "Fila",
    title: "Na fila",
    detail: "Esperando uma vaga para abrir o navegador.",
  },
  {
    key: "before",
    label: "Antes do consentimento",
    title: "Lendo a loja antes de qualquer interação",
    detail:
      "Abrindo a loja num navegador de verdade e registrando o que ela grava sem perguntar nada.",
  },
  {
    key: "after",
    label: "Depois do consentimento, e a política",
    title: "Respondendo ao banner e procurando a política",
    detail:
      "Aceitando o banner para ver o que muda depois, e localizando a política de privacidade publicada.",
  },
] as const;

type Stage = (typeof STEPS)[number]["key"];

export function Waiting({
  status,
  since,
  reading,
}: {
  status: string;
  /** When this wait started: the request, or the moment a slot opened. */
  since: string | null;
  /** Whether the pre-consent reading has already landed on the row. */
  reading: boolean;
}) {
  // Null until mounted, so the server and the browser never disagree about
  // what time it is — the one hydration mismatch a live clock guarantees.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());

    // The first reading is scheduled rather than set here: a clock is an
    // external system, and calling setState in the body of an effect cascades a
    // render. A zero-delay timeout is the same instant to a person and the
    // right shape to React.
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 1000);

    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, []);

  const seconds = now && since ? (now.getTime() - Date.parse(since)) / 1000 : 0;
  const slow = seconds > SLOW_AFTER_SECONDS;

  // Which step is running, from what the row can actually say. Three, and not
  // one more: the queue, the first reading, and everything after it. A fourth
  // step would be a progress bar we cannot observe, and a page that invents
  // progress is worse than one that admits it has three.
  const stage: Stage =
    status === "pending" ? "queue" : reading ? "after" : "before";

  const at = STEPS.findIndex(({ key }) => key === stage);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" ? (
          <Badge variant="outline">na fila</Badge>
        ) : (
          <Badge>
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            lendo
          </Badge>
        )}
        {now && since && (
          <span className="text-sm text-muted-foreground">
            {status === "pending" ? "pedido há" : "começou há"}{" "}
            {elapsed(since, now)}
          </span>
        )}
      </div>

      <Card className="gap-5 bg-primary/10 px-6">
        <div className="flex items-start gap-3">
          <IconScan
            size={18}
            stroke={2}
            className="mt-0.5 shrink-0 text-sidebar-primary"
          />
          <div role="status" className="flex flex-col gap-1">
            <span className="font-medium">{STEPS[at].title}</span>
            <p className="max-w-[560px] text-sm text-muted-foreground">
              {STEPS[at].detail} Esta página se atualiza sozinha — pode fechar e
              voltar depois.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-2.5">
          {STEPS.map((step, index) => (
            <li key={step.key} className="flex items-center gap-2.5 text-sm">
              <Mark done={index < at} doing={index === at} />
              <span
                className={cn(
                  index === at
                    ? "font-medium"
                    : index < at
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70"
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        {/* Time, not progress.

            A bar of how much of the reading is done would be a bar we cannot
            observe — there is no such number to read. This one is the clock
            against the invocation's own ceiling, which is a real quantity, and
            the caption says so rather than letting the shape imply otherwise.
            The steps above are the actual progress, and they stay. */}
        {now && since && (
          <div className="flex flex-col gap-1.5">
            <div
              role="progressbar"
              aria-label="Tempo decorrido do exame"
              aria-valuemin={0}
              aria-valuemax={CEILING_SECONDS}
              aria-valuenow={Math.min(Math.round(seconds), CEILING_SECONDS)}
              className="h-1.5 overflow-hidden rounded-4xl bg-foreground/10"
            >
              <div
                className="h-full rounded-4xl bg-primary transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${Math.min(100, (seconds / CEILING_SECONDS) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between gap-4 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {elapsed(since, now)} decorridos
              </span>
              <span>para sozinho em 3min</span>
            </div>
          </div>
        )}

        {/* The sentence the product had been keeping to itself. Both halves are
            measured: the range is what the queue actually does, and the three
            minutes is the invocation's own ceiling, not a guess. */}
        <p className="max-w-[560px] text-sm text-muted-foreground">
          {status === "pending"
            ? "Começa assim que uma vaga abrir. Cada exame na frente leva de 30 segundos a dois minutos."
            : slow
              ? "Esta loja está levando mais que a média — costuma acontecer com loja pesada, que continua carregando por um minuto ou mais. O exame segue."
              : "A barra é o tempo, não o progresso: ela anda com o relógio até o teto acima, porque quanto falta é justamente o que não sabemos. Costuma terminar em menos de um minuto."}
        </p>
      </Card>

      {/* Only while there is nothing real to show. The moment the first reading
          lands, the page renders it instead — a skeleton next to the data it is
          a skeleton of would be pretending to wait for something that arrived. */}
      {!reading && <Coming />}
    </div>
  );
}

/**
 * Where the result will be, at the size it will be.
 *
 * Not a spinner and not filler: the page currently jumps from one line of text
 * to a full report, and reserving the shape is what keeps the arrival from
 * shoving everything the person was reading off the screen. Which means the
 * shape has to be the real one — the score's board of numbers, and the grid of
 * cards under it, at the height the cards actually come in at.
 */
function Coming() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <Card className="px-6">
        <div className="flex gap-9">
          <Skeleton className="h-[76px] w-40" />
          <Skeleton className="h-[76px] w-24" />
          <Skeleton className="h-[76px] w-24" />
        </div>
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-3 w-full max-w-md" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 md:[grid-auto-rows:minmax(20rem,1fr)]">
        {[0, 1, 2, 3].map((card) => (
          <Card key={card} size="sm" className="h-full gap-3 px-5">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3.5 w-full max-w-[260px]" />
            <Skeleton className="flex-1 w-full" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Three marks: done, doing, and not yet.
 *
 * The amber is the current step, which is the one thing on this card somebody
 * is looking for. No colour means anything about the store here — this is our
 * own progress, and ADR-0005 leaves the palette free to say so.
 */
function Mark({ done, doing }: { done: boolean; doing: boolean }) {
  if (done) {
    return (
      <IconCheck
        size={15}
        stroke={2.5}
        className="shrink-0 text-muted-foreground"
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-[15px] shrink-0 items-center justify-center",
        doing ? "text-sidebar-primary" : "text-muted-foreground/40"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          doing
            ? "size-2 animate-pulse bg-current"
            : "size-1.5 border border-current"
        )}
      />
    </span>
  );
}
