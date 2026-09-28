import "@/components/elleva/clara/clara.css";
import "./evento-claro.css";
import { CartProvider } from "@/lib/cart";

// Página de evento no visual claro (28/09/2026): mesmo cabeçalho e rodapé da
// home, dentro do componente. A versão escura "A Noite" segue em evento.css +
// evento-noite.tsx para voltar. Precisa do carrinho pro fluxo de compra real.
export default function EventoLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
