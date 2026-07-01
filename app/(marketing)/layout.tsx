import { CartProvider } from "@/lib/cart";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";
import MotionProvider from "@/components/motion/motion-provider";
import { getAuth, homeForRole } from "@/lib/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getAuth();

  return (
    <CartProvider>
      <MotionProvider>
        <div className="marketing-mono">
          <Nav loggedIn={!!user} homeHref={homeForRole(role)} />
          <main>{children}</main>
          <Footer />
        </div>
      </MotionProvider>
    </CartProvider>
  );
}
