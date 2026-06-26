import Link from "next/link";

export function ProducerCTA() {
  return (
    <section className="container" style={{ padding: "48px 48px 64px" }}>
      <div className="cta">
        <div className="cta-glow" />
        <div style={{ position: "relative" }}>
          <span className="eyebrow eyebrow-gold no-rule">Para sua indústria</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 34,
              fontWeight: 500,
              color: "#F6F3EB",
              letterSpacing: "-.025em",
              margin: "14px 0 0",
              maxWidth: 520,
            }}
          >
            Comece a imprimir <span className="serif accent-gold">hoje mesmo</span>.
          </h2>
          <p style={{ color: "#B8C1D0", fontSize: 16, marginTop: 14, maxWidth: 480 }}>
            14 dias gratuitos, sem cartão de crédito. Migração assistida do seu
            sistema legado e onboarding com a nossa equipe.
          </p>
        </div>
        <Link href="/signup" className="btn btn-gold btn-lg" style={{ position: "relative" }}>
          Começar gratuitamente
        </Link>
      </div>
    </section>
  );
}
