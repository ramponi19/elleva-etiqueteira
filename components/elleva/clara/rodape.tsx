// Rodapé claro (home e página do evento). Estilos em clara.css.
import Link from "next/link";
import { EllevaLogo } from "@/components/brand/EllevaLogo";

export function RodapeClaro() {
  return (
    <footer className="rodape">
      <div className="wrap">
        <div className="rodape-grade">
          <div className="rodape-marca">
            <EllevaLogo variant="horizontal" className="h-8 w-auto" />
          </div>
          <div className="rodape-col">
            <h3>Elleva</h3>
            <Link prefetch={false} href="/agenda">Agenda</Link>
            <Link prefetch={false} href="/produtores">Para produtores</Link>
            <Link prefetch={false} href="/ajuda">Central de ajuda</Link>
          </div>
          <div className="rodape-col">
            <h3>Legal</h3>
            <Link prefetch={false} href="/terms">Política de compras</Link>
            <Link prefetch={false} href="/privacy">Privacidade</Link>
          </div>
          <div className="rodape-col">
            <h3>Contato</h3>
            <a href="mailto:contato@ellevaeventos.com.br">contato@ellevaeventos.com.br</a>
          </div>
        </div>
        <p className="rodape-base">© 2026 Elleva Tickets</p>
      </div>
    </footer>
  );
}
