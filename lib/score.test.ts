import { describe, expect, test } from "vitest";
import { scoreOf, tally, type Dimension } from "./score";

const TRACKERS = [
  {
    name: "Meta Pixel",
    cookie_pattern: "^_fbp$",
    host_pattern: "facebook\\.net$",
  },
  { name: "Hotjar", cookie_pattern: "^_hj", host_pattern: null },
  { name: "Criteo", cookie_pattern: "^cto_", host_pattern: null },
];

/** A policy that covers everything, so a test can take one thing away at a time. */
const COMPLETE = `
Política de privacidade da Doceria Exemplo Ltda., inscrita no CNPJ 12.345.678/0001-90.
Usamos Meta, Hotjar e Criteo para medir a navegação.
Você pode revogar o consentimento a qualquer momento.
Fale conosco em privacidade@exemplo.com.br.
Você tem os direitos do titular previstos no art. 18, incluindo portabilidade e
confirmação da existência de tratamento.
Nosso encarregado responde no mesmo endereço.
`;

const reading = (over = {}) => ({
  consent_banner: "accepted" as const,
  policy_state: "found",
  policy_text: COMPLETE,
  cookies: [] as { name: string; phase?: "pre-consent" | "post-consent" }[],
  requests: [] as { host: string; phase?: "pre-consent" | "post-consent" }[],
  ...over,
});

const of = (over = {}) => scoreOf(reading(over), TRACKERS);
const dim = (over: object, key: string): Dimension =>
  of(over).dimensions.find((d) => d.key === key)!;

describe("scoreOf", () => {
  test("the weights add up to a hundred", () => {
    const total = of().dimensions.reduce((sum, d) => sum + d.weight, 0);
    expect(total).toBe(100);
  });

  test("gives full marks to a store that waited, asked and declared", () => {
    const score = of({
      cookies: [
        { name: "_fbp", phase: "post-consent" },
        { name: "_hjSession", phase: "post-consent" },
      ],
    });

    expect(score.value).toBe(100);
    expect(score.measured).toBe(100);
  });

  test("takes off the consent share that fired early", () => {
    const cookies = [
      { name: "_fbp", phase: "pre-consent" as const },
      { name: "_hjSession", phase: "post-consent" as const },
    ];

    expect(dim({ cookies }, "consentimento").earned).toBe(15);
    expect(of({ cookies }).value).toBeLessThan(100);
  });

  test("counts what the policy names and what it does not", () => {
    const cookies = [
      { name: "_fbp", phase: "pre-consent" as const },
      { name: "cto_bundle", phase: "pre-consent" as const },
    ];

    expect(
      dim({ cookies, policy_text: "Usamos Meta para medir." }, "nomeia").detail
    ).toBe("A política nomeia 1 dos 2 rastreadores observados.");
  });
});

describe("o que a política declara", () => {
  const without = (line: RegExp) => COMPLETE.replace(line, "");

  test("finds each point when the policy covers it", () => {
    for (const key of [
      "revogacao",
      "controlador",
      "contato",
      "direitos",
      "encarregado",
    ]) {
      expect(dim({}, key).earned, key).toBe(dim({}, key).weight);
    }
  });

  test("misses the point when the policy does not make it", () => {
    expect(
      dim({ policy_text: without(/Você pode revogar.*\n/) }, "revogacao").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/.*CNPJ.*\n/) }, "controlador").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/Fale conosco.*\n/) }, "contato").earned
    ).toBe(0);
    expect(
      dim({ policy_text: without(/Nosso encarregado.*\n/) }, "encarregado")
        .earned
    ).toBe(0);
  });

  // One right named in passing is a retention paragraph; two is a policy
  // actually listing them.
  test("wants more than one word to call the rights listed", () => {
    expect(
      dim({ policy_text: "Falamos de eliminação dos dados." }, "direitos")
        .earned
    ).toBe(0);
    expect(
      dim(
        {
          policy_text:
            "Você tem portabilidade e anonimização, nos termos do art. 18.",
        },
        "direitos"
      ).earned
    ).toBe(7);
  });
});

/**
 * The half that keeps the number from lying: a reading that could not measure
 * something scores nothing for it in *either* direction. Charging the store
 * for our own browser's failure is how a score turns into an accusation.
 */
describe("o que a leitura não conseguiu medir", () => {
  const noPolicy = { policy_state: "not-found", policy_text: null };

  test("leaves every policy point out when the policy was not reached", () => {
    const score = of(noPolicy);

    for (const d of score.dimensions.filter((d) => d.group === "declara")) {
      expect(d.earned, d.key).toBeNull();
    }
    // Only what the browser watched: consent and banner.
    expect(score.measured).toBe(45);
    // And therefore no number. A store that fired nothing would otherwise get
    // a confident 100 built on 45% of the criteria.
    expect(score.value).toBeNull();
  });

  test("does not charge the store for a banner we could not answer", () => {
    expect(dim({ consent_banner: "unrecognised" }, "banner").earned).toBeNull();
    expect(of({ consent_banner: "unrecognised" }).measured).toBe(85);
  });

  // A banner our browser looked for and did not find is a different fact from
  // one it could not answer, and this is the one that costs points (#32).
  test("does charge for a banner that is not there at all", () => {
    expect(dim({ consent_banner: "not-found" }, "banner").earned).toBe(0);
    expect(of({ consent_banner: "not-found" }).measured).toBe(100);
  });

  test("says how little it could measure when almost nothing was readable", () => {
    expect(of({ ...noPolicy, consent_banner: "unrecognised" }).measured).toBe(
      30
    );
  });
});

/**
 * The excerpt is what makes a point checkable, so what it must never do is
 * quote the policy wrong. Two things are being tested: that the marked run is
 * the store's own words and not ours, and that the offsets survive an accent —
 * they come from the folded text and are used to slice the original.
 */
describe("o trecho citado", () => {
  const evidence = (over: object, key: string) => dim(over, key).evidence!;

  const plain = (over: object, key: string) => {
    const ev = evidence(over, key);
    if (ev.kind !== "excerpt") throw new Error(`${key} não citou trecho`);
    return ev.segments.map((s) => s.text).join("");
  };

  const marks = (over: object, key: string) => {
    const ev = evidence(over, key);
    if (ev.kind !== "excerpt") throw new Error(`${key} não citou trecho`);
    return ev.segments.filter((s) => s.mark).map((s) => s.text);
  };

  test("marks the store's own words, not ours", () => {
    expect(marks({}, "revogacao")).toEqual(["revogar"]);
    expect(marks({}, "contato")).toEqual([
      "Fale conosco",
      "privacidade@exemplo.com.br",
    ]);
  });

  test("quotes text that is really in the policy", () => {
    const quoted = plain({}, "revogacao").replaceAll("…", "");
    expect(COMPLETE.replace(/\s+/g, " ")).toContain(
      quoted.replace(/\s+/g, " ")
    );
  });

  // The offsets are computed over text without accents. A policy with accents
  // before the match is what catches an off-by-one in that mapping.
  test("does not slide when the policy has accents before the match", () => {
    const policy_text =
      "Informação, manutenção e proteção: você poderá revogar o consentimento.";

    expect(marks({ policy_text }, "revogacao")).toEqual(["revogar"]);
  });

  // A quote that opens halfway through the previous sentence reads as a
  // mis-citation even when every word is the store's. This is also the one
  // that catches the excerpt window sliding: it passed while the sentence
  // break was being skipped outright.
  test("opens the quote at the sentence the match lives in", () => {
    // Long enough on both sides that the window opens mid-preamble and the
    // sentence break sits just inside it, which is the only shape where a
    // mis-offset search for that break shows up at all.
    const policy_text = `Esta loja trata dados pessoais de quem visita para operar o carrinho, medir a navegação, atender pedidos e cumprir obrigações legais, sempre nos termos desta política e da legislação aplicável. O titular tem à sua disposição os canais indicados adiante e, além deles, a possibilidade de rever a escolha feita no banner, podendo revogar o consentimento a qualquer tempo.`;

    expect(plain({ policy_text }, "revogacao")).toMatch(/^…O titular tem/);
  });

  // The patterns are declared best-first, so the excerpt has to follow the
  // list and not the document: an address is the contact channel, a sentence
  // that merely says "canal de atendimento" is a reference to one.
  test("anchors on the strongest match, not the leftmost", () => {
    // Far enough apart that only one of the two can be in the window: the
    // weaker phrase comes first in the document, the address comes first in
    // the pattern list, and the excerpt has to follow the list.
    const policy_text = `Fale conosco pelo canal de atendimento indicado no rodapé desta página, de segunda a sexta, das nove às dezoito horas, exceto feriados nacionais, para assuntos comerciais, trocas, devoluções, prazos de entrega, cancelamentos e demais dúvidas sobre os seus pedidos nesta loja. Para exercer os direitos previstos na legislação de proteção de dados, escreva para dpo@exemplo.com.br.`;

    const quoted = plain({ policy_text }, "contato");
    expect(quoted).toContain("dpo@exemplo.com.br");
    expect(quoted).not.toContain("Fale conosco");
  });

  // Policy text arrives wrapped at whatever width the page used. A wrap is not
  // a full stop, and treating it as one cut the controller's own name off the
  // front of the evidence that was supposed to identify them.
  test("does not take a wrapped line for the end of a sentence", () => {
    const policy_text =
      "A Doceria Exemplo Ltda., inscrita no CNPJ sob o nº\n12.345.678/0001-90, é a controladora dos dados.";

    expect(plain({ policy_text }, "controlador")).toContain("Doceria Exemplo");
  });

  test("does not put an ellipsis after a full stop", () => {
    const policy_text =
      "Usamos cookies. Você pode revogar o consentimento quando quiser. Guardamos o registro do seu aceite por cinco anos.";

    expect(plain({ policy_text }, "revogacao")).not.toContain(".…");
  });

  test("marks every hit that fell inside the same passage", () => {
    const policy_text =
      "Você tem portabilidade, anonimização e correção de dados, nos termos do art. 18.";

    expect(marks({ policy_text }, "direitos").length).toBeGreaterThan(1);
  });

  // "Não encontramos" is unfalsifiable on its own. The words we looked for are
  // what let somebody tell us we looked for the wrong ones.
  test("says which words it looked for when the point is not there", () => {
    const ev = evidence(
      { policy_text: "Nada sobre isso aqui." },
      "encarregado"
    );

    if (ev.kind !== "names") throw new Error("devia listar o que procuramos");
    expect(ev.rows[0].items).toContain("DPO");
  });
});

describe("tally", () => {
  test("splits the score into the two halves it is made of", () => {
    const score = of({ cookies: [{ name: "_fbp", phase: "post-consent" }] });

    expect(tally(score, "faz")).toMatchObject({ earned: 45, weight: 45 });
    expect(tally(score, "declara")).toMatchObject({ earned: 55, weight: 55 });
  });

  // A half shown out of its full weight when part of it was unreadable would
  // put our own blind spot on the store's account.
  test("leaves out of the half what the reading could not measure", () => {
    const score = of({ consent_banner: "unrecognised" });

    expect(tally(score, "faz").weight).toBe(30);
  });

  test("says when a whole half went unmeasured", () => {
    const score = of({ policy_state: "not-found", policy_text: null });

    expect(tally(score, "declara").measured).toBe(false);
  });
});
