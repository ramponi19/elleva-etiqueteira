"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TemplateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().optional(),
  width_mm: z.coerce.number().positive("Largura deve ser positiva"),
  height_mm: z.coerce.number().positive("Altura deve ser positiva"),
  format: z.enum(["zpl", "pdf", "png"]),
  content: z.string().min(1, "Conteúdo obrigatório"),
});

export type TemplateFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("my_org_id");
  return data as string | null;
}

export async function createTemplate(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Não autenticado." };

  const raw = Object.fromEntries(formData);
  const parsed = TemplateSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const orgId = await getOrgId(supabase);
  if (!orgId) {
    return { message: "Configure sua organização antes de criar modelos." };
  }

  const { error } = await supabase.from("label_templates").insert({
    ...parsed.data,
    org_id: orgId,
    created_by: user.id,
    variables: [],
  });

  if (error) return { message: error.message };

  revalidatePath("/dashboard/etiquetas");
  redirect("/dashboard/etiquetas");
}

export async function updateTemplate(
  id: string,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Não autenticado." };

  const raw = Object.fromEntries(formData);
  const parsed = TemplateSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("label_templates")
    .update({ ...parsed.data, version: undefined })
    .eq("id", id);

  if (error) return { message: error.message };

  revalidatePath("/dashboard/etiquetas");
  revalidatePath(`/dashboard/etiquetas/${id}`);
  redirect("/dashboard/etiquetas");
}

export async function archiveTemplate(id: string) {
  const supabase = await createClient();
  await supabase
    .from("label_templates")
    .update({ is_archived: true })
    .eq("id", id);
  revalidatePath("/dashboard/etiquetas");
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  await supabase.from("label_templates").delete().eq("id", id);
  revalidatePath("/dashboard/etiquetas");
}
