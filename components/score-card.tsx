import {
  IconCircleCheck,
  IconCircleX,
  IconCircleDashed,
} from "@tabler/icons-react";
import { tally, type Dimension, type Evidence, type Group } from "@/lib/score";
import type { Score } from "@/lib/score";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The score, with the caveat that has to travel with it.
 *
 * The sentence under the number is not decoration and not a footer: it is the
 * only thing separating this from a legal opinion about somebody's shop
 * (ADR-0006). It stays next to the number, at every size, wherever the number
 * goes.
 *
 * The number itself is not coloured by how high it is. A green 90 and a red 40
 * would put the verdict in the palette as well as in the digits, and ADR-0005
 * still holds everywhere else — the digits are the concession, not the start
 * of a traffic light. What carries the emphasis instead is size: the number is
 * the biggest thing wherever it appears, because it is what the reader came
 * for and what they are going to act on.
 *
 * Each point of the norm is a card, and every card is the same height. A point
 * cannot look weightier than the one beside it because the passage we quoted
 * happened to be longer.
 */
const GROUP: Record<Group, { title: string; lede: string }> = {
  faz: {
    title: "O que a loja faz",
    lede: "O que o navegador viu acontecer, antes e depois de responder ao banner.",
  },
  declara: {
    title: "O que a loja declara",
    lede: "O que a política publicada diz, no texto que este exame leu e guardou.",
  },
};

export function ScoreCard({ score }: { score: Score }) {
  return (
    <div className="flex flex-col gap-8">
      <Card className="px-6">
        <Board score={score} />

        <p className="max-w-[660px] text-xs text-muted-foreground">
          Esta pontuação é uma leitura técnica composta pelo bugsniff a partir
          do que o navegador observou. Não constitui parecer jurídico nem
          avaliação da situação legal da loja.
          {score.value !== null && score.measured < 100 && (
            <>
              {" "}
              Nesta leitura foi possível medir {score.measured} dos 100 pontos;
              o resto ficou de fora da conta.
            </>
          )}
        </p>
      </Card>

      {(["faz", "declara"] as const).map((group) => (
        <Half key={group} score={score} group={group} />
      ))}
    </div>
  );
}

/**
 * The number, and the two halves it is made of.
 *
 * The split is not a detail of the calculation, it is the product's thesis:
 * half the score is the distance between what the store does and what it says
 * it does. Showing the two sums next to the total is what makes a 66 legible —
 * the same 66 means something different when it is 45 and 21.
 */
function Board({ score }: { score: Score }) {
  if (score.value === null) {
    return (
      <div className="flex flex-col gap-1">
        <span className="font-heading text-2xl font-semibold">
          Sem nota nesta leitura
        </span>
        <p className="max-w-[460px] text-sm text-muted-foreground">
          Metade da nota é a distância entre o que a loja faz e o que ela
          declara, e nosso navegador não chegou à política desta loja. Com só{" "}
          {score.measured} dos 100 pontos medidos, um número aqui diria mais do
          que sabemos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-stretch gap-y-6">
      <Cell label="nota desta leitura">
        <span className="font-heading text-[76px] leading-none font-semibold tracking-[-0.045em] tabular-nums">
          {score.value}
          <span className="text-[22px] font-normal tracking-normal text-muted-foreground">
            {" "}
            / 100
          </span>
        </span>
      </Cell>

      {(["faz", "declara"] as const).map((group) => {
        const half = tally(score, group);

        return (
          <Cell key={group} label={GROUP[group].title.toLowerCase()} divided>
            {half.measured ? (
              <span className="font-heading text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {half.earned}
                <span className="text-base font-normal tracking-normal text-muted-foreground">
                  /{half.weight}
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">não medido</span>
            )}
          </Cell>
        );
      })}
    </div>
  );
}

function Cell({
  label,
  divided,
  children,
}: {
  label: string;
  divided?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-end gap-2 pr-9",
        divided && "border-l border-border pl-9"
      )}
    >
      {children}
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * One half of the audit: its own heading, its own sum, and its points.
 *
 * The sum counts only what this reading could measure, so a half with an
 * unreadable point is shown out of what was readable. `24/45` when 30 points
 * were measurable would charge the store for our own blind spot.
 */
function Half({ score, group }: { score: Score; group: Group }) {
  const dimensions = score.dimensions.filter((d) => d.group === group);
  if (dimensions.length === 0) return null;

  const half = tally(score, group);

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-medium">
            {GROUP[group].title}
          </h2>
          <p className="text-xs text-muted-foreground">{GROUP[group].lede}</p>
        </div>

        {half.measured && (
          <span className="font-heading text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {half.earned}
            <span className="text-[15px] font-normal tracking-normal text-muted-foreground">
              /{half.weight}
            </span>
          </span>
        )}
      </div>

      {/* Every card the same height, and the row free to grow past it if a
          quoted passage runs long — cutting the evidence to fit the grid would
          be trimming the one thing on the card that can be checked.

          The floor is lower for a half nothing could be measured in: those
          cards hold a sentence and no evidence, and a wall of seven tall empty
          cards is the reading looking broken rather than looking partial. */}
      <div
        className={cn(
          "grid gap-4 md:grid-cols-2",
          half.measured
            ? "md:[grid-auto-rows:minmax(20rem,1fr)]"
            : "md:[grid-auto-rows:minmax(10rem,1fr)]"
        )}
      >
        {dimensions.map((dimension) => (
          <Point key={dimension.key} dimension={dimension} />
        ))}
      </div>
    </section>
  );
}

/**
 * One point of the norm: its score, what the reading found, and what backs it.
 *
 * The score comes first and comes big, because it is what the eye is looking
 * for. The mark that says full, missing or unmeasured sits in the opposite
 * corner, small, so it does not compete with the digits.
 */
function Point({ dimension }: { dimension: Dimension }) {
  const { earned, weight } = dimension;
  const missing = earned !== null && earned < weight;

  return (
    <Card
      size="sm"
      className={cn(
        "h-full gap-3 px-5",
        // The amber is where the action is, and nowhere else. A full mark stays
        // neutral: a high score does not get to be green (ADR-0005).
        missing && "shadow-[inset_3px_0_0_0_var(--color-primary)]",
        earned === null && "bg-transparent ring-foreground/8"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {earned === null ? (
          <span className="text-sm text-muted-foreground">não medido</span>
        ) : (
          <span className="font-heading text-4xl leading-none font-semibold tracking-[-0.035em] tabular-nums">
            {earned}
            <span className="text-base font-normal tracking-normal text-muted-foreground">
              /{weight}
            </span>
          </span>
        )}

        <Mark earned={earned} weight={weight} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-medium">{dimension.label}</span>
        <p className="text-xs text-muted-foreground">{dimension.detail}</p>
      </div>

      {dimension.evidence ? (
        <Backing evidence={dimension.evidence} />
      ) : (
        <span className="flex-1" />
      )}

      <p className="text-xs text-muted-foreground/75">{dimension.norm}</p>
    </Card>
  );
}

/**
 * What holds the point up.
 *
 * It takes the space left over in the card on purpose: a fixed card height
 * with the slack between the elements reads as a layout accident, and the same
 * slack inside the evidence reads as the evidence having room.
 */
function Backing({ evidence }: { evidence: Evidence }) {
  return (
    <figure className="m-0 flex flex-1 flex-col gap-1.5">
      {evidence.kind !== "names" || evidence.caption ? (
        <figcaption className="text-[11px] text-muted-foreground">
          {evidence.caption}
        </figcaption>
      ) : null}

      {evidence.kind === "excerpt" && (
        <blockquote className="flex-1 rounded-xl bg-muted px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
          “
          {evidence.segments.map((segment, index) =>
            segment.mark ? (
              // Underlined, never highlighted. Amber over the words that
              // satisfied the check would be a third meaning for the one
              // colour that already means action and pre-consent.
              <mark
                key={index}
                className="bg-transparent font-medium text-foreground underline decoration-dotted underline-offset-2"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}
          ”
        </blockquote>
      )}

      {evidence.kind === "names" && (
        <div className="flex flex-1 flex-col gap-2">
          {evidence.rows.map((row) => (
            <div key={row.caption} className="flex flex-col gap-1.5">
              {row.caption && (
                <span className="text-[11px] text-muted-foreground">
                  {row.caption}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {row.items.map((item) => (
                  <Badge
                    key={item}
                    variant={row.early ? "default" : "secondary"}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {evidence.detail && (
            <p className="text-xs text-muted-foreground">{evidence.detail}</p>
          )}
        </div>
      )}

      {evidence.kind === "link" && (
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl bg-muted px-3.5 py-3">
          <a
            href={evidence.href}
            rel="nofollow noreferrer"
            className="font-mono text-xs break-all underline"
          >
            {evidence.href}
          </a>
          <span className="text-[13px] text-muted-foreground">
            {evidence.detail}
          </span>
        </div>
      )}

      {evidence.kind === "note" && (
        <p className="flex-1 rounded-xl bg-muted px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
          {evidence.detail}
        </p>
      )}
    </figure>
  );
}

/**
 * Three marks, not two: full, partial, and not measured.
 *
 * The third is the one that matters. A dimension our browser could not read
 * looks nothing like a dimension the store failed — showing them alike is how
 * a measurement gap becomes an accusation.
 */
function Mark({ earned, weight }: { earned: number | null; weight: number }) {
  if (earned === null) {
    return (
      <IconCircleDashed
        size={18}
        stroke={2}
        className="mt-0.5 shrink-0 text-muted-foreground"
      />
    );
  }

  const Icon = earned === weight ? IconCircleCheck : IconCircleX;
  return (
    <Icon
      size={18}
      stroke={2}
      className={cn(
        "mt-0.5 shrink-0",
        earned === weight ? "text-muted-foreground" : "text-primary"
      )}
    />
  );
}
