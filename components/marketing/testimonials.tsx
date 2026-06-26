const TESTIMONIALS = [
  {
    quote:
      "Reduzimos os erros de etiquetagem em 94% no primeiro mês. A integração com nosso SAP foi feita em dois dias.",
    author: "Ricardo Almeida",
    role: "Gerente de TI Industrial",
    company: "Indústria Alfa",
    initials: "RA",
  },
  {
    quote:
      "A API é impecável. Migrei do nosso sistema legado em uma semana e economizo 3 horas por turno.",
    author: "Fernanda Costa",
    role: "Engenheira de Processos",
    company: "BrasilPack",
    initials: "FC",
  },
  {
    quote:
      "Gerenciar 8 unidades em um único painel era impossível antes. Agora é trivial. Suporte excepcional.",
    author: "Marcos Oliveira",
    role: "Diretor de Operações",
    company: "Grupo Nordex",
    initials: "MO",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="container" style={{ padding: "48px 48px 16px" }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow eyebrow-gold">Clientes</span>
        <h2 className="h2" style={{ fontSize: 34, marginTop: 14 }}>
          Resultado real em operações <span className="serif accent-gold">reais</span>
        </h2>
      </div>
      <div className="ev-grid">
        {TESTIMONIALS.map((t) => (
          <div key={t.author} className="feature-card">
            <p
              className="serif"
              style={{ fontSize: 18, lineHeight: 1.5, color: "var(--text-primary)", marginBottom: 20 }}
            >
              &ldquo;{t.quote}&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "var(--navy-800)",
                  color: "var(--text-invert)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t.initials}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.author}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {t.role} · {t.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
