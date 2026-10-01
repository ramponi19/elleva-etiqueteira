import "@/components/elleva/clara/clara.css";
import "./conta-clara.css";
import { getContaResumo, requireAuth } from "@/lib/auth";
import { CabecalhoClaro } from "@/components/elleva/clara/cabecalho";
import { RodapeClaro } from "@/components/elleva/clara/rodape";
import { ContaTabs } from "@/components/elleva/conta-tabs";

// Minha conta no visual claro (01/10/2026): cabeçalho e rodapé da home (num
// .eclara com display:contents, para o CSS dele não atropelar o Tailwind do
// conteúdo) e o conteúdo no tema neutro .eneutro (globals.css). A versão
// escura segue em conta.css (e no git).
export default async function ContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Qualquer usuário logado tem conta
  await requireAuth();
  const conta = await getContaResumo();

  return (
    <div className="ect-claro">
      <div className="eclara eclara-contents"><CabecalhoClaro conta={conta} /></div>
      <main className="ect-conteudo eneutro min-h-[70vh]">
        <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-10">
          <h1 className="display-2 text-tinta">Minha conta</h1>
          <div className="mt-6">
            <ContaTabs />
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <div className="eclara eclara-contents"><RodapeClaro /></div>
    </div>
  );
}
