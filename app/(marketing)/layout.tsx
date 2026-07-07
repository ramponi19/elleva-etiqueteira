import { CartProvider } from "@/lib/cart";
import Nav from "@/components/elleva/nav";
import Footer from "@/components/elleva/footer";
import MotionProvider from "@/components/motion/motion-provider";
import { getAuth } from "@/lib/auth";

function initialsFrom(name: string | null, email: string | null): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "?";
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, fullName, avatarUrl } = await getAuth();

  return (
    <CartProvider>
      <MotionProvider>
        <Nav
          loggedIn={!!user}
          role={role}
          name={fullName ?? user?.email ?? "Você"}
          email={user?.email ?? ""}
          avatarUrl={avatarUrl}
          initials={initialsFrom(fullName ?? null, user?.email ?? null)}
        />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </MotionProvider>
    </CartProvider>
  );
}
