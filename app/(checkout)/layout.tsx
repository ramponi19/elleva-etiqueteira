import "./checkout.css";
import Link from "next/link";
import { CartProvider } from "@/lib/cart";

// Checkout com cromo escuro próprio (nav minimalista, foco na compra).
// Precisa do carrinho. Isolado do layout claro de marketing.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="echk">
        <div className="amb" aria-hidden />
        <header className="echk-nav">
          <Link href="/" aria-label="Elleva Tickets"><img src="/logo-elleva.png" alt="Elleva Tickets" /></Link>
          <span className="safe">Compra segura</span>
        </header>
        <div className="ck-body">{children}</div>
      </div>
    </CartProvider>
  );
}
