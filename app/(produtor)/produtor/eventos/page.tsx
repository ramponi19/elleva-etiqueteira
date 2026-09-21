import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

// Lista de eventos consolidada no Início do produtor.
export default async function ProdutorEventos() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo
  // (docs do Next: "A layout also does not control whether the rest of the
  // route renders"), então a guarda tem que estar aqui também.
  await requireAuth();
  redirect("/produtor");
}
