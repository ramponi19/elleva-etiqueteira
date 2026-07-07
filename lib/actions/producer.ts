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
  const dest = to.startsWith("/produtor") ? to : "/produtor/eventos";
  redirect(dest);
}
