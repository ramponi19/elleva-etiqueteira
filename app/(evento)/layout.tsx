import "./evento.css";
import { CartProvider } from "@/lib/cart";

// Página de evento tem cromo escuro próprio (nav/rodapé no componente).
// Precisa do carrinho pro fluxo de compra real.
export default function EventoLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
