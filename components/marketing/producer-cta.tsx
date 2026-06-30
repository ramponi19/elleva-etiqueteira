import Link from "next/link";

export default function ProducerCTA() {
  return (
    <section className="container" style={{ padding: "48px 48px 64px" }}>
      <div className="cta">
        <div className="cta-glow" />
        <div style={{ position: "relative" }}>
          <span className="eyebrow eyebrow-gold no-rule">Para produtores</span>
          <h2
            style={{
              fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500,
              color: "#FFFFFF", letterSpacing: "-.025em", margin: "14px 0 0", maxWidth: 520,
            }}
          >
            Faça seu evento <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "#FFFFFF" }}>com a gente</span>.
          </h2>
          <p style={{ color: "#BBBBBB", fontSize: 16, marginTop: 14, maxWidth: 480 }}>
            Produção, divulgação e bilheteria em um só lugar. Falamos a sua língua e cuidamos do resto.
          </p>
        </div>
        <Link href="/agenda" className="btn btn-gold btn-lg" style={{ position: "relative" }}>
          Falar com a equipe
        </Link>
      </div>
    </section>
  );
}
