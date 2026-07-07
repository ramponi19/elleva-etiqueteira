import { requireRole } from "@/lib/auth";
import Nav from "@/components/elleva/nav";
import Footer from "@/components/elleva/footer";
import { ContaTabs } from "@/components/elleva/conta-tabs";

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

export default async function ContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Qualquer usuário logado tem conta
  const { user, role, fullName, avatarUrl } = await requireRole([
    "customer",
    "producer",
    "admin",
  ]);

  return (
    <>
      <Nav
        loggedIn={!!user}
        role={role}
        name={fullName ?? user!.email ?? "Você"}
        email={user!.email ?? ""}
        avatarUrl={avatarUrl}
        initials={initialsFrom(fullName ?? null, user!.email ?? null)}
      />
      <main className="min-h-[70vh] bg-papel">
        <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-10">
          <h1 className="display-2 text-tinta">Minha conta</h1>
          <div className="mt-6">
            <ContaTabs />
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
