import { describe, expect, test } from "vitest";
import { elapsed, timeAgo } from "./time";

const NOW = new Date("2026-08-31T12:00:00Z");
const ago = (ms: number) => timeAgo(new Date(NOW.getTime() - ms), NOW);

describe("timeAgo", () => {
  test("does not count seconds", () => {
    expect(ago(0)).toBe("agora");
    expect(ago(40_000)).toBe("agora");
  });

  test("picks the unit that fits", () => {
    expect(ago(12 * 60_000)).toBe("há 12 minutos");
    expect(ago(3 * 3_600_000)).toBe("há 3 horas");
    expect(ago(2 * 86_400_000)).toBe("anteontem");
  });

  // The boundary is where a wrong comparison shows: 59 minutes must not
  // already be an hour, and 60 must not still be minutes.
  test("changes unit at the boundary and not before", () => {
    expect(ago(59 * 60_000)).toBe("há 59 minutos");
    expect(ago(60 * 60_000)).toBe("há 1 hora");
    expect(ago(23 * 3_600_000)).toBe("há 23 horas");
    expect(ago(24 * 3_600_000)).toBe("ontem");
  });
});

describe("quanto tempo isso já está rodando", () => {
  const start = new Date("2026-09-01T12:00:00Z");
  const depois = (segundos: number) =>
    new Date(start.getTime() + segundos * 1000);

  test("conta em segundos, porque é o número que se vê mexer", () => {
    expect(elapsed(start, depois(0))).toBe("0 segundos");
    expect(elapsed(start, depois(1))).toBe("1 segundo");
    expect(elapsed(start, depois(42))).toBe("42 segundos");
  });

  test("passa a minutos quando segundos deixam de dizer algo", () => {
    expect(elapsed(start, depois(60))).toBe("1 min");
    expect(elapsed(start, depois(95))).toBe("1 min 35 s");
    expect(elapsed(start, depois(180))).toBe("3 min");
  });

  test("nunca conta para trás", () => {
    // O relógio do navegador não é o do banco, e uma diferença de alguns
    // segundos não pode virar "-3 segundos" na tela.
    expect(elapsed(start, depois(-5))).toBe("0 segundos");
  });
});
