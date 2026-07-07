import type { Metadata } from "next";
import { EmBreve } from "@/components/elleva/em-breve";

export const metadata: Metadata = { title: "Favoritos" };

export default function ContaFavoritos() {
  return <EmBreve icon="solar:heart-bold-duotone" nota="Salvar eventos favoritos em breve." />;
}
