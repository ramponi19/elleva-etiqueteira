import Link from "next/link";
import Icon from "@/components/shared/icon";

export function Hero() {
  return (
    <section className="container" style={{ padding: "48px 48px 24px" }}>
      <div className="hero-stage">
        <div className="hero-glow" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div>
            <span className="eyebrow eyebrow-gold">Gestão de etiquetas industriais</span>
            <h1 className="h1 hero-title" style={{ marginTop: 20 }}>
              Do modelo à etiqueta
              <br />
              <span className="serif accent-gold">sem fricção</span>
            </h1>
            <div className="hero-meta">
              <span>
                <Icon icon="lucide:printer" style={{ verticalAlign: -2, color: "#D3BA83" }} />{" "}
                Multi-impressora
              </span>
              <span>
                <Icon icon="lucide:zap" style={{ verticalAlign: -2, color: "#D3BA83" }} /> API
                em tempo real
              </span>
            </div>
            <p className="hero-desc">
              Controle modelos, impressoras e jobs de impressão em uma plataforma
              elegante. Do chão de fábrica à rastreabilidade — tudo integrado.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
              <Link
                href="/signup"
                className="btn btn-gold btn-lg"
                style={{ boxShadow: "var(--sh-gold)" }}
              >
                Começar gratuitamente
              </Link>
              <Link href="#features" className="btn btn-ghost-dark btn-lg">
                Ver funcionalidades
              </Link>
            </div>
            <div className="hero-dots">
              <span className="active" />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="poster">
            <Icon icon="solar:tag-horizontal-bold-duotone" style={{ fontSize: 64, color: "var(--gold-500)" }} />
            <span className="poster-label">PRÉVIA DA ETIQUETA</span>
          </div>
        </div>
      </div>
    </section>
  );
}
