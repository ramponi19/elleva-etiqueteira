import { CartProvider } from "@/lib/cart";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Nav />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}
