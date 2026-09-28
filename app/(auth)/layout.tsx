import "./auth-claro.css";
import Link from "next/link";
import { EllevaLogo } from "@/components/brand/EllevaLogo";

// Login, cadastro e senha no visual claro (28/09/2026): fundo cinza bem claro,
// cartão branco e o tema neutro (.eneutro, em globals.css) trocando os tokens
// da paleta antiga. A versão escura segue em auth.css (e no git).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eau-claro eneutro">
      <Link href="/" aria-label="Elleva Tickets — início" className="marca">
        <EllevaLogo variant="horizontal" className="h-8 w-auto" />
      </Link>
      <div className="box">{children}</div>
    </div>
  );
}
