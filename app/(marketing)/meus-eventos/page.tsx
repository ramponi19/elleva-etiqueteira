import { redirect } from "next/navigation";

// A área do produtor agora tem shell próprio; "Meus eventos" é o Início.
export default function MeusEventos() {
  redirect("/produtor");
}
