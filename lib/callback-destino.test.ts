import { describe, it, expect, vi } from "vitest";

// O /callback troca o código do Supabase pela sessão e manda a pessoa para o
// ?next=. Aqui a troca é simulada (sempre dá certo) para testar só o destino.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async () => ({ data: { user: { id: "u1" } }, error: null }),
    },
  }),
}));

const { GET } = await import("@/app/(auth)/callback/route");

const SITE = "https://www.ellevaeventos.com.br";

async function destinoDoCallback(next: string): Promise<string> {
  const url = `${SITE}/callback?code=abc&next=${encodeURIComponent(next)}`;
  const res = await GET(new Request(url));
  return res.headers.get("location") ?? "";
}

describe("/callback — destino depois de entrar", () => {
  it("segue o caminho interno pedido", async () => {
    expect(await destinoDoCallback("/checkout")).toBe(`${SITE}/checkout`);
    expect(await destinoDoCallback("/conta?aba=ingressos")).toBe(`${SITE}/conta?aba=ingressos`);
  });

  it.each([
    "/\t/evil.com",
    "/\n/evil.com",
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
  ])("destino inválido %j volta para a home", async (next) => {
    expect(await destinoDoCallback(next)).toBe(`${SITE}/`);
  });
});
