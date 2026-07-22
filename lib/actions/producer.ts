"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Promove o usuário logado a "producer" (se ainda for "customer") e o leva a uma
// área de produtor. Estilo Sympla: qualquer pessoa pode criar evento — ao clicar
// em "Criar evento"/"Meus eventos" o papel é elevado automaticamente.
export async function becomeProducerAndGo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile?.role ?? "customer") === "customer") {
    await supabase.from("profiles").update({ role: "producer" }).eq("id", user.id);
    // O header (layout de marketing) lê o papel a cada request; revalida a home.
    revalidatePath("/", "layout");
  }

  const to = String(formData.get("to") ?? "");
  const allowed = to.startsWith("/produtor") || to === "/criar-evento";
  const dest = allowed ? to : "/produtor";
  redirect(dest);
}

/** Salva a conta de repasse (chave Pix) do produtor. */
export async function savePayoutAccount(input: {
  pixType: string;
  pixKey: string;
  holder: string;
  doc: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sem sessão." };

  const pixKey = input.pixKey.trim();
  if (!pixKey) return { ok: false, error: "Informe a chave Pix." };
  if (!input.holder.trim()) return { ok: false, error: "Informe o titular da conta." };

  const { error } = await supabase
    .from("profiles")
    .update({
      payout_pix_type: input.pixType || null,
      payout_pix_key: pixKey,
      payout_holder: input.holder.trim(),
      payout_doc: input.doc.trim() || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/produtor/financeiro");
  return { ok: true };
}
