import { describe, it, expect } from "vitest";
import { formatBRL, formatM2, formatMonthYear, pluralize } from "../formatacao";

describe("formatacao", () => {
  it("formats BRL", () => {
    expect(formatBRL(580000)).toContain("580.000,00");
    expect(formatBRL(null)).toBe("—");
  });
  it("formats m2", () => {
    expect(formatM2(75)).toBe("75 m²");
    expect(formatM2(75.5)).toBe("75,5 m²");
    expect(formatM2(null)).toBe("—");
  });
  it("formats month/year", () => {
    expect(formatMonthYear("2026-12-15")).toMatch(/dez/i);
    expect(formatMonthYear(null)).toBe("—");
  });
  it("pluralizes", () => {
    expect(pluralize(1, "vaga", "vagas")).toBe("1 vaga");
    expect(pluralize(2, "vaga", "vagas")).toBe("2 vagas");
  });
});
