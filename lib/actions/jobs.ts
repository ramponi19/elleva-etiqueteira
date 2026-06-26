"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const JobSchema = z.object({
  template_id: z.string().uuid("Selecione um modelo válido"),
  printer_id: z.string().uuid("Selecione uma impressora válida"),
  quantity: z.coerce.number().int().min(1).max(9999),
  variables_data: z.string().optional(),
});

export type JobFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("my_org_id");
  return data as string | null;
}

export async function createJob(
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Não autenticado." };

  const raw = Object.fromEntries(formData);
  const parsed = JobSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const orgId = await getOrgId(supabase);
  if (!orgId) return { message: "Configure sua organização primeiro." };

  let variables_data = {};
  try {
    if (parsed.data.variables_data) {
      variables_data = JSON.parse(parsed.data.variables_data);
    }
  } catch {
    return { message: "Variáveis em formato JSON inválido." };
  }

  const { error } = await supabase.from("print_jobs").insert({
    org_id: orgId,
    template_id: parsed.data.template_id,
    printer_id: parsed.data.printer_id,
    quantity: parsed.data.quantity,
    variables_data,
    requested_by: user.id,
    status: "queued",
  });

  if (error) return { message: error.message };

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelJob(id: string) {
  const supabase = await createClient();
  await supabase
    .from("print_jobs")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "queued");
  revalidatePath("/dashboard/jobs");
}
