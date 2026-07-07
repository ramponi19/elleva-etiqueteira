import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { CriarEventoForm } from "@/components/elleva/criar-evento-form";

export const metadata: Metadata = { title: "Criar Evento" };

export default async function CriarEventoPage() {
  // Só produtor/admin. Quem chega pelo botão "Criar evento" já foi promovido.
  await requireRole(["producer", "admin"]);
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
