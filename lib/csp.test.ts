import { describe, it, expect, vi } from "vitest";

// A CSP sai do next.config (headers). Aqui ela é lida e quebrada em diretivas.
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projetoteste.supabase.co");
const { default: config } = await import("../next.config");

async function diretivas(): Promise<Map<string, string[]>> {
  const regras = (await config.headers!()) as { headers: { key: string; value: string }[] }[];
  const csp = regras.flatMap((r) => r.headers).find((h) => h.key === "Content-Security-Policy")!.value;
  return new Map(
    csp.split(";").map((d) => d.trim().split(/\s+/)).map(([nome, ...fontes]) => [nome, fontes]),
  );
}

// SDK do Mercado Pago no cartão: impressão digital do aparelho (antifraude) e
// telemetria. Fonte: observado em produção em 19/10/2026 (console do checkout de
// cartão: as três chamadas bloqueadas por connect-src) + código do SDK v2.
const HOSTS_MP_CONNECT = ["https://www.mercadolibre.com", "https://api.mercadolibre.com"];

describe("CSP — hosts do SDK do Mercado Pago", () => {
  it.each(HOSTS_MP_CONNECT)("connect-src libera %s", async (host) => {
    expect((await diretivas()).get("connect-src")).toContain(host);
  });

  it("sem curinga de mercadolibre em nenhuma diretiva", async () => {
    for (const [, fontes] of await diretivas()) {
      expect(fontes.filter((f) => /\*.*mercadolibre/.test(f))).toEqual([]);
    }
  });

  it("os hosts do mercadolibre ficam só em connect-src", async () => {
    for (const [nome, fontes] of await diretivas()) {
      if (nome === "connect-src") continue;
      expect(fontes.filter((f) => f.includes("mercadolibre"))).toEqual([]);
    }
  });
});
