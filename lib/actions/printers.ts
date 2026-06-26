"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const PrinterSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  model: z.string().optional(),
  ip_address: z.string().optional(),
  dpi: z.coerce.number().int().positive().optional(),
  location: z.string().optional(),
  serial_number: z.string().optional(),
});

export type PrinterFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("my_org_id");
  return data as string | null;
}

export async function createPrinter(
  _prev: PrinterFormState,
  formData: FormData
): Promise<PrinterFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Não autenticado." };

  const raw = Object.fromEntries(formData);
  const parsed = PrinterSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const orgId = await getOrgId(supabase);
  if (!orgId) return { message: "Configure sua organização primeiro." };

  const { error } = await supabase.from("printers").insert({
    ...parsed.data,
    org_id: orgId,
    dpi: parsed.data.dpi ?? 203,
  });

  if (error) return { message: error.message };

  revalidatePath("/dashboard/impressoras");
  redirect("/dashboard/impressoras");
}

export async function updatePrinter(
  id: string,
  _prev: PrinterFormState,
  formData: FormData
): Promise<PrinterFormState> {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData);
  const parsed = PrinterSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase
    .from("printers")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { message: error.message };

  revalidatePath("/dashboard/impressoras");
  redirect("/dashboard/impressoras");
}

export async function deletePrinter(id: string) {
  const supabase = await createClient();
  await supabase.from("printers").delete().eq("id", id);
  revalidatePath("/dashboard/impressoras");
}

export async function setPrinterStatus(
  id: string,
  status: "online" | "offline"
) {
  const supabase = await createClient();
  await supabase
    .from("printers")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard/impressoras");
}
