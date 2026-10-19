import { describe, it, expect } from "vitest";
import { destinoSeguro } from "@/lib/destino";

const SITE = "https://www.ellevaeventos.com.br";

/** Para onde o navegador iria de fato: resolve como o proxy (new URL). */
function resolve(destino: string): URL {
  return new URL(destino, `${SITE}/login`);
}

describe("destinoSeguro — aceita caminho interno", () => {
  it.each([
    ["/conta", "/conta"],
    ["/produtor/financeiro", "/produtor/financeiro"],
    ["/checkout?cupom=X#pagar", "/checkout?cupom=X#pagar"],
    ["/evento/show-tal?ref=wa", "/evento/show-tal?ref=wa"],
  ])("%s → %s", (entrada, esperado) => {
    expect(destinoSeguro(entrada)).toBe(esperado);
  });

  it("sem destino usa o padrão", () => {
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro(undefined)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
    expect(destinoSeguro(null, "")).toBe("");
  });
});

describe("destinoSeguro — nunca sai do site", () => {
  const ataques: [string, string][] = [
    ["tab", "/\t/evil.com"],
    ["tab no meio da barra dupla", "/\t\t/evil.com"],
    ["newline", "/\n/evil.com"],
    ["carriage return + newline", "/\r\n/evil.com"],
    ["nulo", "/\u0000/evil.com"],
    ["barra dupla", "//evil.com"],
    ["barra dupla com caminho", "//evil.com/conta"],
    ["barra + barra invertida", "/\\evil.com"],
    ["barra invertida dupla", "\\\\evil.com"],
    ["barra invertida + barra", "\\/evil.com"],
    ["esquema https", "https://evil.com"],
    ["esquema http", "http://evil.com/conta"],
    ["esquema relativo ao protocolo com espaço", " //evil.com"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["arroba (userinfo)", "@evil.com"],
    ["sem barra inicial", "evil.com"],
  ];

  it.each(ataques)("%s → cai no padrão", (_nome, entrada) => {
    expect(destinoSeguro(entrada)).toBe("/");
  });

  it.each(ataques)("%s → resolvido continua no domínio da Elleva", (_nome, entrada) => {
    expect(resolve(destinoSeguro(entrada)).origin).toBe(SITE);
  });
});
