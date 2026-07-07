import { CartProvider } from "@/lib/cart";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";
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

  // "Complete seus dados" — % real a partir do que temos no perfil.
  const checks = [
    true, // conta criada
    !!user?.email_confirmed_at, // email confirmado
    !!(fullName && fullName.trim().length > 1), // nome completo
    !!avatarUrl, // foto de perfil
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <CartProvider>
      <MotionProvider>
        <div className="marketing-mono">
          <Nav
            loggedIn={!!user}
            role={role}
            name={fullName ?? user?.email ?? "Você"}
            email={user?.email ?? ""}
            avatarUrl={avatarUrl}
            initials={initialsFrom(fullName ?? null, user?.email ?? null)}
            completion={completion}
          />
          <main>{children}</main>
          <Footer />
        </div>
      </MotionProvider>
    </CartProvider>
  );
}
