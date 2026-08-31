import {
  IconCircleCheck,
  IconCircleX,
  IconCircleDashed,
} from "@tabler/icons-react";
import type { Score } from "@/lib/score";
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
 * of a traffic light.
 */
const GROUP = {
  faz: "O que a loja faz",
  declara: "O que a loja declara",
} as const;

export function ScoreCard({ score }: { score: Score }) {
  return (
    <div className="flex flex-col gap-4">
      {score.value === null ? (
        <div className="flex flex-col gap-1">
          <span className="font-heading text-2xl font-semibold">
            Sem nota nesta leitura
          </span>
          <p className="max-w-[460px] text-sm text-muted-foreground">
            Metade da nota é a distância entre o que a loja faz e o que ela
            declara, e nosso navegador não chegou à política desta loja. Com só{" "}
            {score.measured} dos 100 pontos medidos, um número aqui diria mais
            do que sabemos.
          </p>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-5xl font-semibold tabular-nums">
            {score.value}
          </span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
      )}

      <p className="max-w-[460px] text-xs text-muted-foreground">
        Esta pontuação é uma leitura técnica composta pelo bugsniff a partir do
        que o navegador observou. Não constitui parecer jurídico nem avaliação
        da situação legal da loja.
        {score.value !== null && score.measured < 100 && (
          <>
            {" "}
            Nesta leitura foi possível medir {score.measured} dos 100 pontos; o
            resto ficou de fora da conta.
          </>
        )}
      </p>

      {(["faz", "declara"] as const).map((group) => (
        <div key={group} className="flex flex-col gap-3">
          <h3 className="text-xs text-muted-foreground">{GROUP[group]}</h3>
          <ul className="flex flex-col gap-3">
            {score.dimensions
              .filter((d) => d.group === group)
              .map((dimension) => (
                <li key={dimension.key} className="flex gap-2.5">
                  <Verdict
                    earned={dimension.earned}
                    weight={dimension.weight}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {dimension.label}{" "}
                      <span className="font-normal text-muted-foreground tabular-nums">
                        {dimension.earned === null
                          ? "não medido"
                          : `${dimension.earned}/${dimension.weight}`}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dimension.detail}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {dimension.norm}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Three marks, not two: full, partial, and not measured.
 *
 * The third is the one that matters. A dimension our browser could not read
 * looks nothing like a dimension the store failed — showing them alike is how
 * a measurement gap becomes an accusation.
 */
function Verdict({
  earned,
  weight,
}: {
  earned: number | null;
  weight: number;
}) {
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
