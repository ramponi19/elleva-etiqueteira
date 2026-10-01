import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { destinoSeguro } from "@/lib/destino";

const AUTH_ROUTES = ["/login", "/signup"];
// Áreas logadas: sem sessão, vai pro login guardando onde estava (?next=), para
// voltar ao mesmo lugar depois de entrar. As páginas seguem com requireAuth()
// (defesa em profundidade: o proxy barra, a página confirma).
const AREAS_LOGADAS = ["/produtor", "/admin", "/conta"];
const ehAreaLogada = (p: string) => AREAS_LOGADAS.some((a) => p === a || p.startsWith(a + "/"));

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Storefront é público. Sem credenciais do Supabase, apenas segue.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Roda em TODA requisição. Além de dizer quem está logado, é esta chamada
  // que renova o token vencido e regrava os cookies (getClaims() chama
  // getSession() por dentro) — não remover, senão o usuário é deslogado à toa.
  // getClaims() e não getUser(): com a chave ES256 do projeto a assinatura é
  // verificada aqui, sem ida ao servidor de Auth por request (ver lib/auth.ts).
  // Redirect leva junto os cookies que o Supabase acabou de renovar (senão o
  // token renovado se perde e a pessoa é deslogada à toa).
  const redirecionar = (url: URL) => {
    const r = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  if (!userId && ehAreaLogada(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return redirecionar(url);
  }

  // Usuário logado não precisa ver login/signup — manda pro ?next= (se veio de
  // uma área logada) ou pra área do papel dele.
  if (userId && AUTH_ROUTES.includes(request.nextUrl.pathname)) {
    const next = destinoSeguro(request.nextUrl.searchParams.get("next"), "");
    if (next) return redirecionar(new URL(next, request.url));
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = (profile?.role as string) ?? "user";
    const dest = role === "admin" ? "/admin" : "/conta";

    const url = request.nextUrl.clone();
    url.pathname = dest;
    return redirecionar(url);
  }

  return supabaseResponse;
}

// `monitoring` está fora do matcher: é o túnel do Sentry — relatório de erro
// não deve pagar consulta de auth no Supabase nem depender de sessão pra passar.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
