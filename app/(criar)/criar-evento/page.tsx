import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { CriarEventoForm } from "@/components/elleva/criar-evento-form";

export const metadata: Metadata = { title: "Criar Evento" };

export default async function CriarEventoPage() {
  // Qualquer conta logada pode criar evento (modelo de mercado).
  await requireAuth();
  return (
    <div className="bg-papel">
      <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-10">
        <h1 className="display-2 text-tinta">
          Criar <span className="text-sol">Evento</span> Presencial
        </h1>
        <p className="corpo-suave mb-8 mt-1">
          Preencha as informações abaixo e publique seu evento.
        </p>
        <CriarEventoForm />
      </div>
    </div>
  );
}
