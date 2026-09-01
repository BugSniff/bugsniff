/**
 * O que mudou entre duas versões de um documento.
 *
 * A versão é imutável (ADR-0003) e é a ela que uma revisão jurídica se prende,
 * então "gerar de novo" é sempre criar outra coisa, nunca corrigir esta. O que
 * a pessoa precisa antes de aprovar é a única pergunta que resta: o que ficou
 * diferente do texto que ela já leu.
 *
 * Por linha, não por palavra. Um documento legal é lido por parágrafo, e um
 * diff de palavras dentro de uma cláusula reescrita produz um confete que
 * esconde exatamente o que mudou.
 */

export type DiffLine = {
  kind: "kept" | "added" | "removed";
  text: string;
};

/**
 * As linhas em comum, na ordem, pelo algoritmo de sempre.
 *
 * Tabela de subsequência comum máxima. Quadrática, e isso é suficiente: os
 * documentos aqui têm dezenas de linhas, não milhares, e o custo de um
 * algoritmo mais esperto seria pago em quem consegue ler este arquivo.
 */
function commonLength(before: readonly string[], after: readonly string[]) {
  const table: number[][] = Array.from({ length: before.length + 1 }, () =>
    new Array(after.length + 1).fill(0)
  );

  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i][j] =
        before[i] === after[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  return table;
}

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const table = commonLength(a, b);

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: "kept", text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ kind: "removed", text: a[i] });
      i++;
    } else {
      lines.push({ kind: "added", text: b[j] });
      j++;
    }
  }

  while (i < a.length) lines.push({ kind: "removed", text: a[i++] });
  while (j < b.length) lines.push({ kind: "added", text: b[j++] });

  return lines;
}

/** Quantas linhas entraram e quantas saíram, para dizer isso antes de mostrar. */
export function diffCount(lines: readonly DiffLine[]) {
  return {
    added: lines.filter(({ kind }) => kind === "added").length,
    removed: lines.filter(({ kind }) => kind === "removed").length,
  };
}

/**
 * Só o que mudou, com algumas linhas em volta.
 *
 * Um documento de cem linhas com duas alteradas mostrado por inteiro é um
 * documento em que ninguém acha as duas. O contexto em volta existe porque uma
 * linha trocada fora do parágrafo dela não quer dizer nada.
 */
export function changedParts(
  lines: readonly DiffLine[],
  around = 2
): DiffLine[][] {
  const interesting = lines
    .map((line, index) => (line.kind === "kept" ? -1 : index))
    .filter((index) => index >= 0);

  if (interesting.length === 0) return [];

  const parts: DiffLine[][] = [];
  let from = Math.max(0, interesting[0] - around);
  let to = Math.min(lines.length - 1, interesting[0] + around);

  for (const index of interesting.slice(1)) {
    // Perto o bastante para virar um bloco só: dois trechos separados por uma
    // linha em comum leem-se pior do que um trecho com ela dentro.
    if (index - around <= to + 1) {
      to = Math.min(lines.length - 1, index + around);
      continue;
    }

    parts.push(lines.slice(from, to + 1));
    from = Math.max(0, index - around);
    to = Math.min(lines.length - 1, index + around);
  }

  parts.push(lines.slice(from, to + 1));
  return parts;
}
