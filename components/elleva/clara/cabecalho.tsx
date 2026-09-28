// Cabeçalho branco e fixo do visual claro (home e página do evento).
// Estilos em components/elleva/clara/clara.css (escopo .eclara).
import Link from "next/link";
import { EllevaLogo } from "@/components/brand/EllevaLogo";
import { EntrarModal } from "@/components/elleva/entrar-modal";
import { MenuConta } from "@/components/elleva/menu-conta";
import type { ContaResumo } from "@/lib/auth";

export function CabecalhoClaro({ conta }: { conta: ContaResumo | null }) {
  return (
    <header className="topo">
      <div className="topo-in">
        <Link className="marca" href="/" aria-label="Elleva Tickets — início"><EllevaLogo variant="horizontal" className="h-6 w-auto sm:h-8" /></Link>
        <form className="busca" action="/agenda" role="search">
          <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" name="q" placeholder="Buscar evento ou cidade" aria-label="Buscar eventos" />
          <button type="submit">Buscar</button>
        </form>
        <nav className="topo-links" aria-label="Principal">
          <Link href="/agenda">Agenda</Link>
          <Link href="/produtores">Criar evento</Link>
          {conta ? <MenuConta conta={conta} claro /> : <EntrarModal className="entrar" />}
        </nav>
      </div>
    </header>
  );
}
