import { describe, it, expect } from "vitest";
import { isValidCPF, onlyDigits, formatCPF } from "@/lib/cpf";

describe("isValidCPF", () => {
  it("aceita CPFs com dígitos verificadores corretos", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true); // sem máscara
  });
  it("rejeita dígito verificador errado", () => {
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });
  it("rejeita sequências repetidas (000..., 111...)", () => {
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("11111111111")).toBe(false);
  });
  it("rejeita tamanho errado ou lixo", () => {
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("")).toBe(false);
    expect(isValidCPF("abcdefghijk")).toBe(false);
  });
});

describe("onlyDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
    expect(onlyDigits("(19) 99999-9999")).toBe("19999999999");
    expect(onlyDigits("")).toBe("");
  });
});

describe("formatCPF", () => {
  it("aplica a máscara 000.000.000-00", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });
  it("formata parcial sem quebrar", () => {
    expect(formatCPF("529")).toBe("529");
    expect(formatCPF("529982")).toBe("529.982");
  });
});
