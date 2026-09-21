import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { EmBreve } from "@/components/elleva/em-breve";

export const metadata: Metadata = { title: "Favoritos" };

export default async function ContaFavoritos() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo
  // (docs do Next: "A layout also does not control whether the rest of the
  // route renders"), então a guarda tem que estar aqui também.
  await requireAuth();
  return <EmBreve icon="solar:heart-bold-duotone" nota="Salvar eventos favoritos em breve." />;
}
