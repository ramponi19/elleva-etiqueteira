import { describe, it, expect } from "vitest";
import { round2, feeUnit, feeOf, DEFAULT_FEE_PCT } from "@/lib/fees";

describe("round2", () => {
  it("arredonda a centavos", () => {
    expect(round2(5.994)).toBe(5.99);
    expect(round2(5.995)).toBe(6); // Math.round(599.5) = 600
    expect(round2(0.1 + 0.2)).toBe(0.3); // corrige o erro de ponto flutuante
  });
});

describe("feeUnit", () => {
  it("calcula a taxa de uma unidade, exata em centavos", () => {
    expect(feeUnit(59.9, 10)).toBe(5.99); // 59,90 a 10%
    expect(feeUnit(100, 10)).toBe(10);
    expect(feeUnit(90, 10)).toBe(9);
  });
  it("respeita o percentual do evento (não é fixo em 10)", () => {
    expect(feeUnit(100, 5)).toBe(5);
    expect(feeUnit(100, 0)).toBe(0);
    expect(DEFAULT_FEE_PCT).toBe(10);
  });
});

describe("feeOf", () => {
  it("soma a taxa cobrada por item × quantidade", () => {
    expect(feeOf([{ price: 100, qty: 2, feePct: 10 }])).toBe(20);
    expect(feeOf([
      { price: 90, qty: 1, feePct: 10 },
      { price: 160, qty: 1, feePct: 10 },
    ])).toBe(25); // 9 + 16
  });
  it("item que ABSORVE a taxa não soma no total do comprador", () => {
    expect(feeOf([{ price: 100, qty: 1, feePct: 10, absorbFee: true }])).toBe(0);
    expect(feeOf([
      { price: 100, qty: 1, feePct: 10, absorbFee: true },
      { price: 100, qty: 1, feePct: 10, absorbFee: false },
    ])).toBe(10); // só o segundo
  });
  it("carrinho vazio = 0", () => {
    expect(feeOf([])).toBe(0);
  });
});
