import "@/components/elleva/clara/clara.css";
import "./institucional-claro.css";
import { getContaResumo } from "@/lib/auth";
import { CabecalhoClaro } from "@/components/elleva/clara/cabecalho";
import { RodapeClaro } from "@/components/elleva/clara/rodape";

// Produtores, Ajuda, Termos e Privacidade no visual claro (01/10/2026): mesmo
// cabeçalho e rodapé da home. O conteúdo das páginas usa os tokens da paleta
// antiga (Tailwind bg-papel/text-tinta…), trocados pelo tema neutro .eneutro
// (globals.css). Cabeçalho e rodapé ficam num .eclara com display:contents:
// pegam os estilos do clara.css sem que as regras dele (sem @layer) atropelem
// os utilitários Tailwind do conteúdo. A versão escura segue em institucional.css.
export default async function InstitucionalLayout({ children }: { children: React.ReactNode }) {
  const conta = await getContaResumo();
  return (
    <div className="einst-claro">
      <div className="eclara eclara-contents"><CabecalhoClaro conta={conta} /></div>
      <div className="einst-conteudo eneutro">{children}</div>
      <div className="eclara eclara-contents"><RodapeClaro /></div>
    </div>
  );
}
