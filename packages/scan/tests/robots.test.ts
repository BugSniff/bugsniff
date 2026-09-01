import { describe, expect, test } from "vitest";
import { disallowedPaths, disallows } from "../robots";

/**
 * A regra que o exame pergunta antes de entrar onde não foi convidado.
 *
 * Os dois erros que ela pode cometer não custam o mesmo. Ler uma página que o
 * site pediu para não ler é uma falta nossa; recusar-se a ler uma que era
 * permitida transforma um arquivo malformado numa política que ninguém
 * escreveu. Então tudo aqui erra para o lado de ler — menos quando a regra é
 * clara.
 */

const VOEGOL = `
# comentário
User-agent: *
Allow: /core/*.css$
Disallow: /core/
Disallow: /profiles/
Disallow: /README.txt
`;

describe("o que o robots.txt proíbe para todo mundo", () => {
  test("lê as regras do grupo aberto a todos", () => {
    expect(disallowedPaths(VOEGOL)).toEqual([
      "/core/",
      "/profiles/",
      "/README.txt",
    ]);
  });

  test("ignora as regras dirigidas a outro robô", () => {
    // Não temos token próprio: um exame que se anunciasse voltaria a ser
    // recusado por se anunciar. As regras de todos são as nossas.
    expect(
      disallowedPaths(
        `User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin`
      )
    ).toEqual(["/admin"]);
  });

  test("entende o grupo introduzido por vários agentes", () => {
    expect(
      disallowedPaths(`User-agent: Googlebot\nUser-agent: *\nDisallow: /x`)
    ).toEqual(["/x"]);
  });

  test("não lê Disallow vazio como proibição", () => {
    // "Disallow:" sozinho é a forma explícita de liberar tudo, e lê-lo como
    // "/" tornaria o site inteiro inalcançável.
    expect(disallowedPaths("User-agent: *\nDisallow:")).toEqual([]);
    expect(disallows("User-agent: *\nDisallow:", "/qualquer")).toBe(false);
  });
});

describe("se a regra cobre este endereço", () => {
  test("a política da voegol é permitida", () => {
    // O caso que originou tudo isto: o robots deles proíbe /core/ e /profiles/,
    // e a política não está em nenhum dos dois.
    expect(
      disallows(
        VOEGOL,
        "/informacoes-legais/politica-de-privacidade-e-protecao-de-dados"
      )
    ).toBe(false);
  });

  test("mas /core/ não é", () => {
    expect(disallows(VOEGOL, "/core/misc/drupal.js")).toBe(true);
  });

  test("prefixo é prefixo", () => {
    expect(disallows("User-agent: *\nDisallow: /admin", "/admin/login")).toBe(
      true
    );
    expect(
      disallows("User-agent: *\nDisallow: /admin", "/administrativo")
    ).toBe(true);
    expect(disallows("User-agent: *\nDisallow: /admin", "/conta/admin")).toBe(
      false
    );
  });

  test("entende o coringa no meio", () => {
    expect(disallows("User-agent: *\nDisallow: /*?*", "/busca?q=1")).toBe(true);
    expect(disallows("User-agent: *\nDisallow: /*?*", "/busca")).toBe(false);
  });

  test("entende o fim de linha ancorado", () => {
    expect(disallows("User-agent: *\nDisallow: /*.pdf$", "/termos.pdf")).toBe(
      true
    );
    expect(
      disallows("User-agent: *\nDisallow: /*.pdf$", "/termos.pdf.html")
    ).toBe(false);
  });

  test("um arquivo vazio não proíbe nada", () => {
    expect(disallows("", "/politica-de-privacidade")).toBe(false);
  });
});
