import "./checkout.css";
import Link from "next/link";
import { EllevaLogo, EllevaSimbolo } from "@/components/brand/EllevaLogo";
import { CartProvider } from "@/lib/cart";

// Checkout com cromo escuro próprio (nav minimalista, foco na compra).
// Precisa do carrinho. Isolado do layout claro de marketing.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="echk">
        <div className="amb" aria-hidden />
        <header className="echk-nav">
          <Link href="/" aria-label="Elleva Tickets">
            <EllevaLogo variant="horizontal" tone="negativo" className="h-6 w-auto sm:h-8 max-[389px]:hidden" />
            <EllevaSimbolo tone="negativo" size={32} className="hidden max-[389px]:block" />
          </Link>
          <span className="safe">Compra segura</span>
        </header>
        <div className="ck-body">{children}</div>
      </div>
    </CartProvider>
  );
}
