import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

// A criação de evento agora vive em /criar-evento (design novo, chrome limpo).
export default async function NovoEvento() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo
  // (docs do Next: "A layout also does not control whether the rest of the
  // route renders"), então a guarda tem que estar aqui também.
  await requireAuth();
  redirect("/criar-evento");
}
