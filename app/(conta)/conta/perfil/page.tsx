import type { Metadata } from "next";
import { EmBreve } from "@/components/elleva/em-breve";

export const metadata: Metadata = { title: "Perfil" };

export default function ContaPerfil() {
  return <EmBreve icon="solar:user-circle-bold-duotone" nota="Edição de perfil em breve." />;
}
