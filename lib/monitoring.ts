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

/** Uma aparição, em uma linha, com a evidência entre parênteses. */
function line({ name, hosts }: Appearance): string {
  return hosts.length > 0
    ? `- ${name} — sua loja enviou dados para ${hosts.join(", ")}`
    : `- ${name} — gravou cookie na sua loja`;
}

/**
 * O aviso, redigido em código e nunca por modelo.
 *
 * Mesma regra do achado (ADR-0001): o modelo escreve prosa de relatório, não
 * mensagem automática que sai de madrugada sem ninguém ler antes. Um texto que
 * varia entre dois envios sobre o mesmo fato é um texto que ninguém pode
 * conferir depois.
 */
export function alertMessage({
  host,
  appearances,
  previousAt,
  scanUrl,
}: {
  /** A loja, pelo endereço que é a identidade dela. */
  host: string;
  appearances: readonly Appearance[];
  /** Quando foi a leitura anterior, a que não tinha isto. */
  previousAt: string;
  /** Link para o exame que encontrou, no bugsniff. */
  scanUrl: string;
}): { subject: string; text: string } {
  const one = appearances.length === 1;

  return {
    subject: one
      ? `${host}: ${appearances[0].name} passou a disparar antes do consentimento`
      : `${host}: ${appearances.length} rastreadores passaram a disparar antes do consentimento`,

    text: [
      `O exame automático de ${host} encontrou ${
        one ? "um serviço" : `${appearances.length} serviços`
      } que não ${one ? "estava" : "estavam"} na leitura de ${when.format(
        new Date(previousAt)
      )}:`,
      "",
      appearances.map(line).join("\n"),
      "",
      `${one ? "Ele dispara" : "Eles disparam"} antes de qualquer interação com o banner de consentimento — ou seja, antes de o visitante responder qualquer coisa.`,
      "",
      "Não sabemos qual app da sua loja introduziu isso: para saber, o bugsniff precisaria estar conectado à plataforma dela. O que sabemos é o endereço para onde os dados foram, acima.",
      "",
      `O exame completo, com as capturas de tela: ${scanUrl}`,
    ].join("\n"),
  };
}
