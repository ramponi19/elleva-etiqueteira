import "./checkout-claro.css";
import Link from "next/link";
import { EllevaLogo, EllevaSimbolo } from "@/components/brand/EllevaLogo";
import { CartProvider } from "@/lib/cart";

// Checkout no visual claro (28/09/2026): barra branca minimalista (foco na
// compra) e o tema neutro (.eneutro, em globals.css) trocando os tokens da
// paleta antiga. A versão escura segue em checkout.css (e no git).
// Precisa do carrinho. Isolado do layout de marketing.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="echk-claro eneutro">
        <header className="echk-nav">
          <Link href="/" aria-label="Elleva Tickets — início">
            <EllevaLogo variant="horizontal" className="h-6 w-auto sm:h-8 max-[389px]:hidden" />
            <EllevaSimbolo size={32} className="hidden max-[389px]:block" />
          </Link>
          <span className="safe">Compra segura</span>
        </header>
        <div className="ck-body">{children}</div>
      </div>
    </CartProvider>
  );
}
