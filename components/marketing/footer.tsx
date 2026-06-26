import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/eagle-bone.png" alt="Elleva" width={32} height={23} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#F6F3EB" }}>
              Elleva{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".3em", color: "var(--gold-500)" }}>
                TICKETS
              </span>
            </span>
          </div>
          <p style={{ color: "#8894A8", fontSize: 13, marginTop: 16, maxWidth: 280, lineHeight: 1.6 }}>
            Ingressos para os melhores eventos do interior de SP e sul de MG. Rápido, seguro e sem fila.
          </p>
        </div>

        <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
          <div className="footer-col">
            <span className="footer-head">Eventos</span>
            <Link href="/agenda" className="footer-link">Shows</Link>
            <Link href="/agenda" className="footer-link">Festas</Link>
            <Link href="/agenda" className="footer-link">Esportes</Link>
            <Link href="/agenda" className="footer-link">Teatro</Link>
          </div>
          <div className="footer-col">
            <span className="footer-head">Elleva</span>
            <span className="footer-link">Quem somos</span>
            <span className="footer-link">Área do produtor</span>
            <span className="footer-link">Política de compras</span>
            <span className="footer-link">Privacidade</span>
          </div>
          <div className="footer-col">
            <span className="footer-head">Contato</span>
            <span className="footer-link">contato@elleva.com.br</span>
            <span className="footer-link">Instagram</span>
            <span className="footer-link">WhatsApp</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-meta">© 2026 ELLEVA TICKETS</span>
        <span className="footer-meta">INTERIOR DE SP · SUL DE MG</span>
      </div>
    </footer>
  );
}
