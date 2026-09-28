import "./criar.css";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { EllevaLogo } from "@/components/brand/EllevaLogo";
import { EntrarModal } from "@/components/elleva/entrar-modal";

export default async function CriarLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuth();
  return (
    <div className="ecri">
      <div className="amb" aria-hidden />
      <nav className="top">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><EllevaLogo variant="horizontal" tone="negativo" className="h-6 w-auto sm:h-8" /></Link>
          {user ? <Link className="nav-right" href="/produtor">Área do produtor</Link> : <EntrarModal className="nav-right" />}
        </div>
      </nav>
      <div className="content">{children}</div>
    </div>
  );
}
