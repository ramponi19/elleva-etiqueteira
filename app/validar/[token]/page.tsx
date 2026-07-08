import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { TicketValidatorElleva } from "@/components/elleva/ticket-validator";
import { LogoElleva } from "@/components/elleva/logo";

export const metadata: Metadata = { title: "Check-in", robots: { index: false, follow: false } };

// Página pública de validação por LINK (equipe de portaria, sem login).
export default async function CheckinPorLink({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let title: string | null = null;
  try {
    const svc = await createServiceClient();
    const { data } = await svc.from("events").select("title").eq("checkin_token", token).single();
    title = data?.title ?? null;
  } catch {
    title = null;
  }
  if (!title) notFound();

  return (
    <main className="min-h-screen bg-papel">
      <header className="border-b-[1.5px] border-tinta bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[560px] items-center justify-between">
          <span className="text-tinta">
            <LogoElleva />
          </span>
          <span className="rotulo text-tinta-60">Check-in</span>
        </div>
      </header>
      <div className="mx-auto max-w-[560px] px-5 py-8">
        <p className="rotulo text-sol-escuro">Portaria</p>
        <h1 className="display-2 mt-1 text-tinta">{title}</h1>
        <p className="corpo-suave mb-6 mt-1">
          Escaneie o QR do ingresso ou digite o código. Cada ingresso entra uma única vez.
        </p>
        <TicketValidatorElleva token={token} />
      </div>
    </main>
  );
}
