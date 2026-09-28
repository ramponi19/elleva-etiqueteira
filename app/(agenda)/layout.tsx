import "@/components/elleva/clara/clara.css";
import "./agenda-clara.css";
import { getContaResumo } from "@/lib/auth";
import { CabecalhoClaro } from "@/components/elleva/clara/cabecalho";
import { RodapeClaro } from "@/components/elleva/clara/rodape";

// Agenda no visual claro (28/09/2026): mesmo cabeçalho e rodapé da home e do
// evento. A versão escura "A Noite" segue em agenda.css (e no git) para voltar.
export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  const conta = await getContaResumo();
  return (
    <div className="eclara eag-clara">
      <CabecalhoClaro conta={conta} />
      {children}
      <RodapeClaro />
    </div>
  );
}
