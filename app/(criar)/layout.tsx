import "./criar.css";
import Link from "next/link";
import { getAuth } from "@/lib/auth";

export default async function CriarLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuth();
  return (
    <div className="ecri">
      <div className="amb" aria-hidden />
      <nav className="top">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><img src="/logo-elleva.png" alt="Elleva Tickets" /></Link>
          <Link className="nav-right" href={user ? "/produtor" : "/login"}>{user ? "Área do produtor" : "Entrar"}</Link>
        </div>
      </nav>
      <div className="content">{children}</div>
    </div>
  );
}
