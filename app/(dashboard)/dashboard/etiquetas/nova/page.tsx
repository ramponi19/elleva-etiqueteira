import { Header } from "@/components/dashboard/header";
import { TemplateForm } from "@/components/dashboard/template-form";
import { createTemplate } from "@/lib/actions/templates";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo modelo" };

export default function NovaEtiquetaPage() {
  return (
    <>
      <Header title="Novo Modelo" description="Crie um template de etiqueta." />
      <main className="p-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <TemplateForm action={createTemplate} />
        </div>
      </main>
    </>
  );
}
