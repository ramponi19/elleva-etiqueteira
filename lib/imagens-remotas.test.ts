import { describe, it, expect, vi } from "vitest";

// O otimizador de imagem (/_next/image) só deve buscar imagem do bucket público
// do PRÓPRIO projeto Supabase — nunca de qualquer *.supabase.co.
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projetoteste.supabase.co");
const { default: config } = await import("../next.config");

type Padrao = { protocol?: string; hostname: string; pathname?: string };
const padroes = (config.images?.remotePatterns ?? []) as Padrao[];

describe("next.config — hosts de imagem permitidos", () => {
  it("nenhum padrão com curinga", () => {
    expect(padroes.filter((p) => p.hostname.includes("*"))).toEqual([]);
  });

  it("Supabase: só o host do projeto e só o storage público", () => {
    const supa = padroes.filter((p) => p.hostname.endsWith(".supabase.co"));
    expect(supa).toEqual([
      { protocol: "https", hostname: "projetoteste.supabase.co", pathname: "/storage/v1/object/public/**" },
    ]);
  });
});
