"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    description: "Para operações em crescimento",
    priceMonthly: 297,
    priceYearly: 247,
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
    priceMonthly: 697,
    priceYearly: 577,
    features: [
      "Impressoras ilimitadas",
      "50.000 impressões/mês",
      "Modelos ilimitados",
      "API + Webhooks",
      "SSO (SAML 2.0)",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    cta: "Começar grátis",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes grupos industriais",
    priceMonthly: null,
    priceYearly: null,
    features: [
      "Tudo do Pro",
      "Impressões ilimitadas",
      "Multi-site centralizado",
      "SLA garantido 99,9%",
      "Onboarding dedicado",
      "Customer Success",
      "Contrato personalizado",
    ],
    cta: "Falar com vendas",
    href: "/contact",
    highlight: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 bg-[#1A2744]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[#C9A96E] text-sm font-semibold uppercase tracking-widest mb-4">
            Planos
          </p>
          <h2
            className="text-4xl sm:text-5xl font-normal text-white mb-4"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Preço justo para
            <br />
            cada tamanho
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={cn("text-sm", !yearly ? "text-white" : "text-white/40")}>
              Mensal
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                yearly ? "bg-[#C9A96E]" : "bg-white/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  yearly ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm flex items-center gap-1.5", yearly ? "text-white" : "text-white/40")}>
              Anual
              <span className="text-xs bg-[#C9A96E]/20 text-[#C9A96E] px-2 py-0.5 rounded-full font-medium">
                −15%
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl p-8 flex flex-col border transition-all",
                  plan.highlight
                    ? "bg-[#C9A96E] border-transparent scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-2xl mb-1",
                      plan.highlight ? "text-[#1A2744]" : "text-white"
                    )}
                    style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                  >
                    {plan.name}
                  </h3>
                  <p className={cn("text-sm", plan.highlight ? "text-[#1A2744]/70" : "text-white/50")}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  {price ? (
                    <div className="flex items-end gap-1">
                      <span
                        className={cn(
                          "text-4xl font-light",
                          plan.highlight ? "text-[#1A2744]" : "text-white"
                        )}
                        style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                      >
                        R${price}
                      </span>
                      <span className={cn("text-sm mb-1", plan.highlight ? "text-[#1A2744]/60" : "text-white/40")}>
                        /mês
                      </span>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "text-3xl",
                        plan.highlight ? "text-[#1A2744]" : "text-white"
                      )}
                      style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                    >
                      Sob consulta
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check
                        size={14}
                        className={plan.highlight ? "text-[#1A2744]" : "text-[#C9A96E]"}
                      />
                      <span className={cn("text-sm", plan.highlight ? "text-[#1A2744]/80" : "text-white/70")}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    "text-center py-3 rounded-xl text-sm font-semibold transition-all",
                    plan.highlight
                      ? "bg-[#1A2744] text-white hover:bg-[#111B33]"
                      : "border border-white/20 text-white hover:bg-white/10"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
