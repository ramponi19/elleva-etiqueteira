import { redirect } from "next/navigation";

// "Meus eventos" agora é o painel no design novo (/meus-eventos).
export default function ProdutorEventos() {
  redirect("/meus-eventos");
}
