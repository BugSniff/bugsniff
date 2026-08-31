import Groq from "groq-sdk";
import { normById } from "../norms";
import { evidenceFor, NORM_CANDIDATES, type Observation } from "./observe";

/**
 * The one thing a model is allowed to do here: write.
 *
 * It receives a fact already established and the full text of the norms that
 * fact admits, and it returns prose plus a passage it copied out of one of
 * them. It does not decide what happened on the store, it does not choose a
 * norm outside the candidates, and it never supplies the citation — that is
 * looked up from the id it picked. Everything it does return still goes
 * through the validator before anyone sees it (ADR-0001).
 */

/**
 * Cheap and fast, because it is called once per observation and a store with
 * twenty trackers is an ordinary store. The writing is a paragraph of
 * Portuguese about a fact it was handed; the difficulty is in the constraints,
 * and the constraints are enforced downstream by code either way.
 */
const MODEL = "openai/gpt-oss-120b";

/** What the model is asked for, and the only shape it can answer in. */
const SCHEMA = {
  type: "object",
  properties: {
    observedFact: { type: "string" },
    normId: { type: "string" },
    normExcerpt: { type: "string" },
  },
  required: ["observedFact", "normId", "normExcerpt"],
  additionalProperties: false,
} as const;

const SYSTEM = `Você redige achados para uma auditoria técnica de loja virtual brasileira.

Um achado é um fato observado acompanhado da norma que o endereça. Você nunca conclui nada sobre a situação jurídica do lojista: concluir sobre o caso concreto é competência privativa da advocacia, e este produto não a exerce.

Regras:
- "observedFact": uma ou duas frases em português, no indicativo, descrevendo apenas o que foi observado na loja. Nomeie o serviço pelo nome que a pessoa reconhece, exatamente como ele aparece no fato — "Meta Pixel", não "_fbp"; "Google Analytics", não "_ga". O cookie e o host podem aparecer, mas nunca no lugar do nome. Não afirme nada além do que o fato fornecido diz: se ele fala de cookies e requisições, não escreva sobre código-fonte, contratos ou intenção. Sem recomendação, sem juízo, sem consequência. Não use as palavras: irregular, em desacordo, violação, infração, ilegal, multa, penalidade, sujeito a sanção, não conforme, risco jurídico, você deve, obrigatório.
- "normId": um dos ids oferecidos, e nenhum outro.
- "normExcerpt": um trecho copiado LETRA POR LETRA do texto da norma escolhida, exatamente como aparece, sem reescrever, sem resumir, sem colchetes e sem reticências. Escolha o trecho que endereça o fato.`;

const normBlock = (kind: Observation["kind"]) =>
  NORM_CANDIDATES[kind]
    .map((id) => {
      const norm = normById(id);
      return norm ? `id: ${id}\n${norm.citation}\n${norm.text}` : null;
    })
    .filter((block): block is string => block !== null)
    .join("\n\n");

/** What the model wrote, before anything has checked it. */
export type Written = {
  observedFact: string;
  normId: string;
  normExcerpt: string;
};

export type Writer = (observation: Observation) => Promise<Written | null>;

/**
 * Asks the model for one finding's prose.
 *
 * Returns null rather than throwing: one observation the model failed to write
 * about should cost that observation, not the whole exam. A finding that never
 * arrives is a finding nobody reads; a scan that dies is a person staring at a
 * page that will never fill in.
 */
export const write: Writer = async (observation) => {
  const groq = new Groq();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Fato observado na loja:\n${evidenceFor(observation)}\n\nNormas disponíveis:\n\n${normBlock(observation.kind)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "achado", strict: true, schema: SCHEMA },
      },
    });

    const content = completion.choices[0]?.message?.content;
    return content ? (JSON.parse(content) as Written) : null;
  } catch (error) {
    // Logged, not swallowed. A missing key or a rate limit produces a scan with
    // no findings at all, which on screen is indistinguishable from a store
    // with nothing to report — the one failure this product must never look like.
    console.error("finding not written", error);
    return null;
  }
};
