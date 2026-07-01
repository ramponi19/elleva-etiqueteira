import Logo from "@/components/shared/logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <Logo variant="light" width={32} />
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 21, letterSpacing: "-.02em", color: "#FFFFFF" }}>
            Elleva Tickets
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 72, flexWrap: "wrap", marginTop: 40 }}>
          <div className="footer-col">
            <span className="footer-head">Elleva</span>
            <span className="footer-link">Quem somos</span>
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
