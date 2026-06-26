import { notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { TemplateForm } from "@/components/dashboard/template-form";
import { createClient } from "@/lib/supabase/server";
import { updateTemplate } from "@/lib/actions/templates";
import type { LabelTemplate } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("label_templates")
    .select("name")
    .eq("id", id)
    .single();
  return { title: (data as { name: string } | null)?.name ?? "Editar modelo" };
}

export default async function EditarEtiquetaPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("label_templates")
    .select("*")
    .eq("id", id)
    .single();

  const template = data as LabelTemplate | null;
  if (!template) notFound();

  const action = updateTemplate.bind(null, id);

  return (
    <>
      <Header
        title={template.name}
        description={`v${template.version} · ${template.width_mm}×${template.height_mm}mm`}
      />
      <main className="p-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <TemplateForm action={action} template={template} />
        </div>
      </main>
    </>
  );
}
