"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/shared/icon";

const PLANS = [
  {
    name: "Starter",
    description: "Para operações em crescimento",
    monthly: 297,
    yearly: 247,
    features: [
      "Até 3 impressoras",
      "5.000 impressões/mês",
      "10 modelos de etiqueta",
      "API REST",
      "Suporte por email",
    ],
    cta: "Começar grátis",
    href: "/signup?plan=starter",
    highlight: false,
  },
  {
    name: "Pro",
    description: "Para indústrias em escala",
    monthly: 697,
    yearly: 577,
    features: [
      "Impressoras ilimitadas",
      "50.000 impressões/mês",
      "Modelos ilimitados",
      "API + Webhooks",
      "SSO (SAML 2.0)",
      "Analytics avançado",
    ],
    cta: "Começar grátis",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes grupos",
    monthly: null,
    yearly: null,
    features: [
      "Tudo do Pro",
      "Impressões ilimitadas",
      "Multi-site centralizado",
      "SLA 99,9%",
      "Onboarding dedicado",
      "Customer Success",
    ],
    cta: "Falar com vendas",
    href: "/contact",
    highlight: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="container" style={{ padding: "48px 48px 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <span className="eyebrow eyebrow-gold">Planos</span>
          <h2 className="h2" style={{ fontSize: 34, marginTop: 14 }}>
            Preço justo para cada <span className="serif accent-gold">tamanho</span>
          </h2>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <span style={{ color: !yearly ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            Mensal
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            style={{
              position: "relative",
              width: 44,
              height: 24,
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              background: yearly ? "var(--gold-500)" : "var(--border)",
              transition: "background .2s",
            }}
            aria-label="Alternar cobrança anual"
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: yearly ? 24 : 4,
                width: 16,
                height: 16,
                borderRadius: 9999,
                background: "#fff",
                transition: "left .2s",
                boxShadow: "0 1px 2px rgba(0,0,0,.2)",
              }}
            />
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: yearly ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            Anual
            <span className="cat-pill" style={{ padding: "2px 8px" }}>
              −15%
            </span>
          </span>
        </div>
      </div>

      <div className="ev-grid">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <div
              key={plan.name}
              className="feature-card"
              style={
                plan.highlight
                  ? { borderColor: "var(--border-gold)", boxShadow: "var(--sh-gold)" }
                  : undefined
              }
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 className="h3" style={{ fontSize: 24 }}>
                  {plan.name}
                </h3>
                {plan.highlight && (
                  <span
                    className="cat-pill"
                    style={{ background: "var(--gold-500)", color: "var(--navy-900)", border: "none" }}
                  >
                    Popular
                  </span>
                )}
              </div>
              <p className="body" style={{ fontSize: 13, marginTop: 4 }}>
                {plan.description}
              </p>

              <div style={{ margin: "20px 0" }}>
                {price ? (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 500 }}>
                    R${price}
                    <span style={{ fontSize: 14, color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
                      /mês
                    </span>
                  </span>
                ) : (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500 }}>
                    Sob consulta
                  </span>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                    <Icon icon="lucide:check" style={{ color: "var(--text-gold)", fontSize: 16 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`btn btn-block ${plan.highlight ? "btn-gold" : "btn-navy"}`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
