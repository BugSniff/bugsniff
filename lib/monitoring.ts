import { trackersIn, type Exam } from "./exams";
import { nameHost, type Tracker } from "@/packages/tracker";

/**
 * O que mudou entre a leitura de hoje e a anterior, e o aviso que sai disso.
 *
 * Uma coisa só é notícia aqui: rastreador que passou a disparar **antes do
 * consentimento** e não disparava antes. É a única mudança que alguém precisa
 * saber no mesmo dia, porque é a que aparece sem ninguém ter escolhido — um
 * app instalado na sexta-feira injeta um pixel, e a loja passa a coletar antes
 * de perguntar sem que o lojista tenha decidido nada.
 *
 * O que sai daqui deliberadamente **não conclui** (ADR-0001): diz que o serviço
 * apareceu, desde quando não estava lá, e para onde os dados foram. Não diz que
 * a loja está irregular, e não pinta nada de vermelho.
 */

/** Um serviço que passou a disparar, com o endereço que o denuncia. */
export type Appearance = {
  /** O nome do serviço, como o fornecedor o chama. */
  name: string;
  /**
   * Os terceiros que ele contactou nesta leitura.
   *
   * A evidência, e o mais perto que chegamos de dizer quem o introduziu: sem
   * conexão com a plataforma da loja (#14–#17) não temos a lista de apps
   * instalados, e apontar um culpado sem ela seria chute sobre a loja de
   * outra pessoa. O endereço é fato observado; o app não é.
   */
  hosts: string[];
};

/**
 * Os rastreadores que a leitura nova tem antes do consentimento e a velha não.
 *
 * Só entra o que a leitura anterior conseguiu medir. Comparar contra um exame
 * que falhou diria que a loja inteira "apareceu" hoje — `trackersIn` já
 * devolve vazio para exame não concluído, e por isso quem chama precisa passar
 * a leitura anterior **bem-sucedida**, não simplesmente a penúltima linha.
 */
export function appeared(
  previous: Exam,
  latest: Exam,
  trackers: readonly Tracker[]
): Appearance[] {
  const before = new Set(trackersIn(previous, "pre-consent", trackers));

  return trackersIn(latest, "pre-consent", trackers)
    .filter((name) => !before.has(name))
    .map((name) => ({
      name,
      hosts: [
        ...new Set(
          (latest.requests ?? [])
            .filter(
              (request) =>
                request.phase === "pre-consent" &&
                nameHost(request.host, trackers) === name
            )
            .map(({ host }) => host)
        ),
      ],
    }));
}

const when = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Uma loja que mudou, com o que mudou nela. */
export type StoreChange = {
  /** A loja, pelo endereço que é a identidade dela. */
  host: string;
  appearances: Appearance[];
  /** Quando foi a leitura anterior, a que não tinha isto. */
  previousAt: string;
  /** Link para o exame que encontrou, no bugsniff. */
  scanUrl: string;
};

/** Uma aparição, em uma linha, com a evidência junto. */
function line({ name, hosts }: Appearance): string {
  return hosts.length > 0
    ? `  - ${name} — a loja enviou dados para ${hosts.join(", ")}`
    : `  - ${name} — gravou cookie na loja`;
}

const count = (n: number, one: string, many: string) =>
  n === 1 ? `1 ${one}` : `${n} ${many}`;

/** O bloco de uma loja dentro do aviso. */
function block(change: StoreChange): string {
  return [
    `${change.host} — ${count(change.appearances.length, "serviço novo", "serviços novos")} desde a leitura de ${when.format(new Date(change.previousAt))}:`,
    change.appearances.map(line).join("\n"),
    `  Exame completo: ${change.scanUrl}`,
  ].join("\n");
}

/**
 * O aviso, redigido em código e nunca por modelo.
 *
 * Mesma regra do achado (ADR-0001): o modelo escreve prosa de relatório, não
 * mensagem automática que sai de madrugada sem ninguém ler antes. Um texto que
 * varia entre dois envios sobre o mesmo fato é um texto que ninguém pode
 * conferir depois.
 *
 * **Um aviso por organização, nunca um por loja.** Numa agência com quarenta
 * lojas, quarenta e-mails numa manhã são o mesmo que nenhum — ninguém lê o
 * trigésimo, e o que se perde é justamente a leitura que importava. O aviso
 * cobre todas as lojas que mudaram na varredura, e o assunto diz quantas são
 * antes de a pessoa abrir.
 */
export function alertMessage(changes: readonly StoreChange[]): {
  subject: string;
  text: string;
} {
  const stores = changes.length;
  const trackers = changes.reduce((n, c) => n + c.appearances.length, 0);
  const one = changes[0];

  return {
    subject:
      stores === 1
        ? one.appearances.length === 1
          ? `${one.host}: ${one.appearances[0].name} passou a disparar antes do consentimento`
          : `${one.host}: ${count(trackers, "rastreador passou", "rastreadores passaram")} a disparar antes do consentimento`
        : `${count(stores, "loja passou", "lojas passaram")} a acionar rastreadores novos antes do consentimento`,

    text: [
      stores === 1
        ? `O exame automático de ${one.host} encontrou ${count(trackers, "serviço que não estava", "serviços que não estavam")} na leitura anterior:`
        : `O exame automático desta noite encontrou ${count(trackers, "serviço novo", "serviços novos")} em ${count(stores, "loja", "lojas")}:`,
      "",
      changes.map(block).join("\n\n"),
      "",
      "Todos disparam antes de qualquer interação com o banner de consentimento — ou seja, antes de o visitante responder qualquer coisa.",
      "",
      "Não sabemos qual app da loja introduziu isso: para saber, o bugsniff precisaria estar conectado à plataforma dela. O que sabemos é o endereço para onde os dados foram, acima.",
    ].join("\n"),
  };
}
