import "./institucional.css";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { LogoElleva } from "@/components/elleva/logo";
import { EntrarModal } from "@/components/elleva/entrar-modal";

export default async function InstitucionalLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuth();
  return (
    <div className="einst">
      <div className="amb" aria-hidden />
      <nav className="top">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Elleva Tickets"><LogoElleva /></Link>
          <div className="nav-links">
            <Link href="/agenda">Agenda</Link>
            <Link href="/produtores">Produtores</Link>
            <Link href="/ajuda">Ajuda</Link>
          </div>
          <div className="nav-right">
            {user ? <Link className="entrar" href="/conta">Minha conta</Link> : <EntrarModal className="entrar" />}
          </div>
        </div>
      </nav>

      <div className="content">{children}</div>

      <footer>
        <div className="foot-grid">
          <div className="foot-brand"><LogoElleva /></div>
          <div className="foot-col"><h5>Elleva</h5><Link prefetch={false} href="/agenda">Agenda</Link><Link prefetch={false} href="/produtores">Produtores</Link><Link prefetch={false} href="/ajuda">Central de ajuda</Link></div>
          <div className="foot-col"><h5>Legal</h5><Link prefetch={false} href="/terms">Política de compras</Link><Link prefetch={false} href="/privacy">Privacidade</Link></div>
          <div className="foot-col"><h5>Contato</h5><a href="mailto:contato@ellevaeventos.com.br">contato@ellevaeventos.com.br</a></div>
        </div>
        <div className="foot-base">© 2026 Elleva Tickets</div>
      </footer>
    </div>
  );
}
