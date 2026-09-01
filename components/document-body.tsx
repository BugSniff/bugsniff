import { BLANK } from "@/packages/document/company";

/**
 * O documento, lido como documento.
 *
 * The generator writes headings, paragraphs and bold — the little that a legal
 * text needs — so this reads that and nothing more. A markdown library would be
 * a dependency and a licence to accept syntax nobody generates, and the text
 * being rendered is text we wrote ourselves three files away.
 *
 * The one thing it does beyond formatting is make `[PREENCHER]` impossible to
 * skim past. A gap in a legal document about somebody's company is the single
 * most important thing on the screen, and the amber is the product's own colour
 * for "action needed" (ADR-0005) — it is not saying anything is wrong, it is
 * saying somebody has to type something.
 */
export function DocumentBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n{2,}/);

  return (
    <article className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        const line = block.trim();

        if (line.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="font-heading mt-2 text-base font-medium first:mt-0"
            >
              {line.slice(3)}
            </h2>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="font-heading text-xl font-semibold">
              {line.slice(2)}
            </h1>
          );
        }

        return (
          <p key={index} className="text-sm leading-relaxed">
            <Inline text={line} />
          </p>
        );
      })}
    </article>
  );
}

/** Bold, and the gap that has to be filled. */
function Inline({ text }: { text: string }) {
  // One pass over both, so a blank inside a bold run is still marked.
  const parts = text.split(/(\*\*[^*]+\*\*|\[PREENCHER\])/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part === BLANK) {
          return (
            <mark
              key={index}
              className="rounded bg-primary/25 px-1 font-medium text-foreground"
            >
              {BLANK}
            </mark>
          );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-medium">
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Line breaks inside a paragraph are the generator's wrapping, not the
        // document's: a legal text reflows, and keeping them would print a
        // ragged column on every screen narrower than the source.
        return <span key={index}>{part.replace(/\n/g, " ")}</span>;
      })}
    </>
  );
}
