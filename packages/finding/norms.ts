import type { NormSources } from "../finding-validator/index";

/**
 * The norms a finding may cite, with the text they are cited from.
 *
 * Held here as source, not fetched and not remembered: the validator rejects
 * any excerpt that does not occur verbatim in the text of the norm it names
 * (ADR-0001), and it can only do that against a text we actually hold. A model
 * quoting the law from memory quotes it nearly right, and nearly right is a
 * false sentence about somebody's shop.
 *
 * Transcribed from the Planalto publication of Lei nº 13.709/2018. The
 * punctuation is the law's; do not tidy it.
 */
export type Norm = {
  /** Stable id. Written into every finding that cites this norm. */
  readonly id: string;
  /** How the norm is referred to in the report, in full. */
  readonly citation: string;
  /** The text the excerpt has to come from. Verbatim. */
  readonly text: string;
};

export const NORMS: readonly Norm[] = [
  {
    id: "lgpd-art-5-xii",
    citation: "Lei nº 13.709/2018 (LGPD), art. 5º, XII",
    text: "Art. 5º Para os fins desta Lei, considera-se: XII - consentimento: manifestação livre, informada e inequívoca pela qual o titular concorda com o tratamento de seus dados pessoais para uma finalidade determinada;",
  },
  {
    id: "lgpd-art-6-vi",
    citation: "Lei nº 13.709/2018 (LGPD), art. 6º, VI",
    text: "Art. 6º As atividades de tratamento de dados pessoais deverão observar a boa-fé e os seguintes princípios: VI - transparência: garantia, aos titulares, de informações claras, precisas e facilmente acessíveis sobre a realização do tratamento e os respectivos agentes de tratamento, observados os segredos comercial e industrial;",
  },
  {
    id: "lgpd-art-7-i",
    citation: "Lei nº 13.709/2018 (LGPD), art. 7º, I",
    text: "Art. 7º O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses: I - mediante o fornecimento de consentimento pelo titular;",
  },
  {
    id: "lgpd-art-8",
    citation: "Lei nº 13.709/2018 (LGPD), art. 8º",
    text: "Art. 8º O consentimento previsto no inciso I do art. 7º desta Lei deverá ser fornecido por escrito ou por outro meio que demonstre a manifestação de vontade do titular. § 1º Caso o consentimento seja fornecido por escrito, esse deverá constar de cláusula destacada das demais cláusulas contratuais. § 2º Cabe ao controlador o ônus da prova de que o consentimento foi obtido em conformidade com o disposto nesta Lei. § 3º É vedado o tratamento de dados pessoais mediante vício de consentimento. § 4º O consentimento deverá referir-se a finalidades determinadas, e as autorizações genéricas para o tratamento de dados pessoais serão nulas.",
  },
  {
    id: "lgpd-art-9",
    citation: "Lei nº 13.709/2018 (LGPD), art. 9º",
    text: "Art. 9º O titular tem direito ao acesso facilitado às informações sobre o tratamento de seus dados, que deverão ser disponibilizadas de forma clara, adequada e ostensiva acerca de, entre outras características previstas em regulamentação para o atendimento do princípio do livre acesso: I - finalidade específica do tratamento; II - forma e duração do tratamento, observados os segredos comercial e industrial; III - identificação do controlador; IV - informações de contato do controlador; V - informações acerca do uso compartilhado de dados pelo controlador e a finalidade; VI - responsabilidades dos agentes que realizarão o tratamento; e VII - direitos do titular, com menção explícita aos direitos contidos no art. 18 desta Lei. § 1º Na hipótese em que o consentimento é requerido, esse será considerado nulo caso as informações fornecidas ao titular tenham conteúdo enganoso ou abusivo ou não tenham sido apresentadas previamente com transparência, de forma clara e inequívoca.",
  },
];

const BY_ID = new Map(NORMS.map((norm) => [norm.id, norm]));

export const normById = (id: string): Norm | undefined => BY_ID.get(id);

/** The texts the validator checks excerpts against. */
export const NORM_SOURCES: NormSources = new Map(
  NORMS.map(({ id, text }) => [id, text])
);
