import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cifrar, decifrar, mascarar, cifraPronta } from "./secrets";

// Chaves fixas de teste (32 bytes). Não são usadas em nenhum ambiente real.
const CHAVE_A = Buffer.alloc(32, 1).toString("base64");
const CHAVE_B = Buffer.alloc(32, 2).toString("base64");
const CHAVE_HEX = Buffer.alloc(32, 3).toString("hex");

const original = process.env.SETTINGS_ENC_KEY;
beforeEach(() => { process.env.SETTINGS_ENC_KEY = CHAVE_A; });
afterEach(() => {
  if (original === undefined) delete process.env.SETTINGS_ENC_KEY;
  else process.env.SETTINGS_ENC_KEY = original;
});

describe("cifra dos segredos de gateway", () => {
  it("vai e volta", () => {
    const token = "APP_USR-1234567890abcdef-093012-abcdef1234567890-987654321";
    expect(decifrar(cifrar(token))).toBe(token);
  });

  it("aceita a chave em hex também", () => {
    process.env.SETTINGS_ENC_KEY = CHAVE_HEX;
    expect(cifraPronta()).toBe(true);
    expect(decifrar(cifrar("segredo"))).toBe("segredo");
  });

  it("não guarda o texto em claro nem repete o ciphertext", () => {
    const a = cifrar("APP_USR-token");
    const b = cifrar("APP_USR-token");
    expect(a).not.toContain("APP_USR-token");
    expect(a).not.toBe(b); // IV aleatório por cifragem
    expect(decifrar(a)).toBe(decifrar(b));
  });

  it("devolve null quando a chave mudou (em vez de lixo)", () => {
    const guardado = cifrar("APP_USR-token");
    process.env.SETTINGS_ENC_KEY = CHAVE_B;
    expect(decifrar(guardado)).toBeNull();
  });

  it("devolve null se o ciphertext foi adulterado no banco", () => {
    const [v, iv, tag] = cifrar("APP_USR-token").split(".");
    const mexido = [v, iv, tag, Buffer.from("outra coisa").toString("base64")].join(".");
    expect(decifrar(mexido)).toBeNull();
    expect(decifrar("nada disso")).toBeNull();
    expect(decifrar(null)).toBeNull();
  });

  it("sem chave não cifra e não decifra", () => {
    delete process.env.SETTINGS_ENC_KEY;
    expect(cifraPronta()).toBe(false);
    expect(() => cifrar("x")).toThrow();
  });

  it("chave de tamanho errado não vale", () => {
    process.env.SETTINGS_ENC_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(cifraPronta()).toBe(false);
  });

  it("máscara mostra o prefixo do ambiente e o fim, nunca o meio", () => {
    const m = mascarar("APP_USR-1234567890abcdef");
    expect(m).toBe("APP_USR-••••••••cdef");
    expect(m).not.toContain("1234567890");
    expect(mascarar("TEST-1234567890abcdef")).toBe("TEST-••••••••cdef");
    expect(mascarar(null)).toBeNull();
    expect(mascarar("curto")).toBe("•••••");
  });
});
