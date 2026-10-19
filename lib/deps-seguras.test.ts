import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Guarda de versão mínima das dependências que já tiveram aviso de segurança
// corrigido. Lê o que está INSTALADO (node_modules), não o package.json: um
// `^16.3.4` no manifesto não garante que o lockfile subiu.

function instalada(pacote: string): string {
  const arq = path.join(process.cwd(), "node_modules", pacote, "package.json");
  return JSON.parse(readFileSync(arq, "utf8")).version as string;
}

/** a >= b, comparando só major.minor.patch (ignora sufixo de pré-release). */
function versaoMaiorOuIgual(a: string, b: string): boolean {
  const pa = a.split("-")[0].split(".").map(Number);
  const pb = b.split("-")[0].split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i];
  }
  return true;
}

describe("versaoMaiorOuIgual", () => {
  it("compara major, minor e patch como números", () => {
    expect(versaoMaiorOuIgual("16.3.8", "16.3.8")).toBe(true);
    expect(versaoMaiorOuIgual("16.3.10", "16.3.8")).toBe(true);
    expect(versaoMaiorOuIgual("16.4.0", "16.3.8")).toBe(true);
    expect(versaoMaiorOuIgual("16.3.7", "16.3.8")).toBe(false);
    expect(versaoMaiorOuIgual("15.9.9", "16.3.8")).toBe(false);
  });
});

describe("dependências com correção de segurança", () => {
  // GHSA-vcvr-r3jv-pc5j (ImageResponse do next/og em Node, corrigido em 16.3.6)
  // e os demais avisos do Next 16 (corrigidos juntos em 16.3.8).
  it("next >= 16.3.8", () => {
    expect(versaoMaiorOuIgual(instalada("next"), "16.3.8")).toBe(true);
  });

});
