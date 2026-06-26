import { Tag, Printer, BarChart3, Zap, Shield, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Tag,
    title: "Modelos inteligentes",
    description:
      "Crie e versione modelos de etiqueta com variáveis dinâmicas, condicionais e lógica de impressão avançada.",
  },
  {
    icon: Printer,
    title: "Gestão de impressoras",
    description:
      "Conecte, monitore e controle impressoras Zebra, Honeywell e TSC de qualquer lugar da fábrica.",
  },
  {
    icon: BarChart3,
    title: "Analytics em tempo real",
    description:
      "Dashboards detalhados de volumes, erros, tempo de resposta e rastreabilidade por produto ou lote.",
  },
  {
    icon: Zap,
    title: "API ultra-rápida",
    description:
      "Integre com seu ERP, MES ou WMS em horas. SDK para Node.js, Python e .NET disponíveis.",
  },
  {
    icon: Shield,
    title: "Segurança enterprise",
    description:
      "SSO com SAML 2.0, RBAC granular, logs de auditoria completos e criptografia em repouso.",
  },
  {
    icon: Globe,
    title: "Multi-site",
    description:
      "Gerencie todas as suas unidades industriais em uma única conta com visibilidade centralizada.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-28 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-[#C9A96E] text-sm font-semibold uppercase tracking-widest mb-4">
            Funcionalidades
          </p>
          <h2
            className="text-4xl sm:text-5xl font-normal text-[#1A2744] mb-4"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Tudo que sua operação
            <br />
            industrial precisa
          </h2>
          <p className="text-[#1A2744]/60 text-lg">
            Do modelo à etiqueta impressa em segundos. Sem planilhas, sem retrabalho.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group bg-white rounded-2xl border border-[#1A2744]/8 p-8 hover:border-[#C9A96E]/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#1A2744]/5 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#C9A96E]/10 transition-colors">
                  <Icon size={22} className="text-[#1A2744] group-hover:text-[#C9A96E] transition-colors" />
                </div>
                <h3
                  className="text-xl text-[#1A2744] mb-2"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {feat.title}
                </h3>
                <p className="text-[#1A2744]/55 text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
