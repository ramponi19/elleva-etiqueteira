import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AUTH_ROUTES = ["/login", "/signup"];

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
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  // Usuário logado não precisa ver login/signup — manda pra área do papel dele.
  if (userId && AUTH_ROUTES.includes(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = (profile?.role as string) ?? "user";
    const dest = role === "admin" ? "/admin" : "/conta";

    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url);
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
