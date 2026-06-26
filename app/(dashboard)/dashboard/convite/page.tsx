import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/lib/actions/members";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aceitar convite" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/dashboard/convite?token=${token}`);
  }

  const result = await acceptInvitation(token);
  const ok = result && "success" in result && result.success;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAFAF8]">
      <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-10 max-w-md w-full text-center">
        {ok ? (
          <>
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={26} className="text-green-500" />
            </div>
            <h1
              className="text-2xl text-[#1A2744] mb-2"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Convite aceito!
            </h1>
            <p className="text-[#1A2744]/50 text-sm mb-6">
              Você agora faz parte da equipe. Bem-vindo ao Elleva.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Ir para o dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle size={26} className="text-red-500" />
            </div>
            <h1
              className="text-2xl text-[#1A2744] mb-2"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Convite inválido
            </h1>
            <p className="text-[#1A2744]/50 text-sm mb-6">
              Este convite expirou, já foi usado ou não existe. Peça um novo ao
              administrador da organização.
            </p>
            <Link
              href="/dashboard"
              className="inline-block border border-[#1A2744]/15 hover:border-[#1A2744]/30 text-[#1A2744] text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Voltar ao dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
