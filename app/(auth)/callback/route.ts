import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Após confirmar/entrar, o usuário permanece na home (estilo Sympla),
      // salvo quando um destino explícito é passado em ?next=.
      // ?next= só aceita caminho interno: "?next=@evil.com" viraria
      // https://dominio@evil.com (host = evil.com) → open redirect/phishing.
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
