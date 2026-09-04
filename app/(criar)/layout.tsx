import "./criar.css";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { LogoElleva } from "@/components/elleva/logo";
import { EntrarModal } from "@/components/elleva/entrar-modal";

export default async function CriarLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuth();
  return (
    <div className="ecri">
      <div className="amb" aria-hidden />
      <nav className="top">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><LogoElleva /></Link>
          {user ? <Link className="nav-right" href="/produtor">Área do produtor</Link> : <EntrarModal className="nav-right" />}
        </div>
      </nav>
      <div className="content">{children}</div>
    </div>
  );
}
