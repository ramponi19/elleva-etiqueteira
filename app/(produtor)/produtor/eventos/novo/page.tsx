import { redirect } from "next/navigation";

// A criação de evento agora vive em /criar-evento (design novo, chrome limpo).
export default function NovoEvento() {
  redirect("/criar-evento");
}
