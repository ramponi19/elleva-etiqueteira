import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const HIGHLIGHTS = [
  "Sem cartão de crédito",
  "14 dias gratuito",
  "Cancele quando quiser",
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#1A2744] overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(201,169,110,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,169,110,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#C9A96E]/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#C9A96E]/15 border border-[#C9A96E]/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
          <span className="text-[#C9A96E] text-sm font-medium">
            Novo: API de impressão em lote
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-normal text-white leading-tight mb-6 text-balance"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          Gestão de etiquetas
          <br />
          <span className="text-[#C9A96E]">industriais sem fricção</span>
        </h1>

        {/* Sub */}
        <p className="max-w-2xl mx-auto text-lg text-white/60 mb-10 leading-relaxed">
          Controle modelos, impressoras e jobs de impressão em uma plataforma
          elegante. Do chão de fábrica à rastreabilidade — tudo integrado.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#D4B882] text-[#1A2744] font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-[#C9A96E]/20 hover:shadow-xl hover:shadow-[#C9A96E]/30 hover:-translate-y-0.5"
          >
            Começar gratuitamente
            <ArrowRight size={18} />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-base transition-colors"
          >
            Ver funcionalidades
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {HIGHLIGHTS.map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-white/50 text-sm">
              <CheckCircle2 size={14} className="text-[#C9A96E]" />
              {item}
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-[#111B33]/80 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-white/30 text-xs">
                app.elleva.com.br/dashboard
              </span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: "Jobs hoje", value: "1.248" },
                { label: "Impressoras ativas", value: "12" },
                { label: "Modelos", value: "47" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 rounded-xl p-4 border border-white/5"
                >
                  <p className="text-white/40 text-xs mb-1">{stat.label}</p>
                  <p
                    className="text-2xl text-white font-light"
                    style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mx-6 mb-6 rounded-xl bg-white/5 border border-white/5 h-32 flex items-center justify-center">
              <p className="text-white/20 text-sm">Gráfico de impressões — últimos 30 dias</p>
            </div>
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-8 inset-x-16 h-16 bg-[#C9A96E]/20 blur-2xl rounded-full" />
        </div>
      </div>
    </section>
  );
}
