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
      "A API é impecável. Migrei do nosso sistema legado em uma semana e economizo 3 horas por turno de operação.",
    author: "Fernanda Costa",
    role: "Engenheira de Processos",
    company: "BrasilPack",
    initials: "FC",
  },
  {
    quote:
      "Gerenciar 8 unidades em um único painel era impossível antes. Agora é trivial. O suporte é excepcional.",
    author: "Marcos Oliveira",
    role: "Diretor de Operações",
    company: "Grupo Nordex",
    initials: "MO",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-28 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#C9A96E] text-sm font-semibold uppercase tracking-widest mb-4">
            Clientes
          </p>
          <h2
            className="text-4xl sm:text-5xl font-normal text-[#1A2744]"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Resultado real em
            <br />
            operações reais
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="bg-white rounded-2xl border border-[#1A2744]/8 p-8 hover:shadow-lg transition-shadow"
            >
              <blockquote
                className="text-[#1A2744]/80 text-base leading-relaxed mb-6 italic"
                style={{ fontFamily: "var(--font-instrument-serif), serif" }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A2744] flex items-center justify-center text-white text-xs font-semibold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[#1A2744] text-sm font-semibold">{t.author}</p>
                  <p className="text-[#1A2744]/50 text-xs">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
