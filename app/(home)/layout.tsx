import "@/components/elleva/clara/clara.css";
import "./home-clara.css";

// A home tem cromo próprio (cabeçalho/rodapé dentro do componente),
// então NÃO usa o layout de marketing — fica isolada e não quebra as
// outras páginas. Visual claro (padrão de mercado) desde 25/09/2026; a
// versão escura "A Noite" segue em home.css + home-noite.tsx para voltar.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
