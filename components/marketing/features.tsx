import Icon from "@/components/shared/icon";

const FEATURES = [
  {
    icon: "solar:tag-horizontal-bold-duotone",
    title: "Modelos inteligentes",
    description:
      "Crie e versione modelos com variáveis dinâmicas, condicionais e lógica de impressão avançada.",
  },
  {
    icon: "solar:printer-bold-duotone",
    title: "Gestão de impressoras",
    description:
      "Conecte, monitore e controle impressoras Zebra, Honeywell e TSC de qualquer lugar da fábrica.",
  },
  {
    icon: "solar:chart-2-bold-duotone",
    title: "Analytics em tempo real",
    description:
      "Dashboards de volumes, erros, tempo de resposta e rastreabilidade por produto ou lote.",
  },
  {
    icon: "solar:bolt-bold-duotone",
    title: "API ultra-rápida",
    description:
      "Integre com seu ERP, MES ou WMS em horas. SDK para Node.js, Python e .NET.",
  },
  {
    icon: "solar:shield-check-bold-duotone",
    title: "Segurança enterprise",
    description:
      "SSO com SAML 2.0, RBAC granular, logs de auditoria e criptografia em repouso.",
  },
  {
    icon: "solar:buildings-2-bold-duotone",
    title: "Multi-site",
    description:
      "Gerencie todas as suas unidades industriais em uma única conta, com visão centralizada.",
  },
];

export function Features() {
  return (
    <section id="features" className="container" style={{ padding: "48px 48px 16px" }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow eyebrow-gold">Funcionalidades</span>
        <h2 className="h2" style={{ fontSize: 34, marginTop: 14 }}>
          Tudo que sua operação <span className="serif accent-gold">precisa</span>
        </h2>
      </div>
      <div className="ev-grid">
        {FEATURES.map((feat) => (
          <div key={feat.title} className="feature-card">
            <div className="feature-ico">
              <Icon icon={feat.icon} style={{ fontSize: 26 }} />
            </div>
            <h3 className="h4" style={{ marginBottom: 8 }}>
              {feat.title}
            </h3>
            <p className="body" style={{ fontSize: 14 }}>
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
