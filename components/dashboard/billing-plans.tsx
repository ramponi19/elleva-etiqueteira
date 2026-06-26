"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    monthly: 297,
    yearly: 247,
    features: [
      "Até 3 impressoras",
      "5.000 impressões/mês",
      "10 modelos",
      "API REST",
      "Suporte por email",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    monthly: 697,
    yearly: 577,
    features: [
      "Impressoras ilimitadas",
      "50.000 impressões/mês",
      "Modelos ilimitados",
      "SSO (SAML 2.0)",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    highlight: true,
  },
];

export function BillingPlans({ currentPlan }: { currentPlan: string }) {
  const [yearly, setYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  function handleSubscribe(plan: "starter" | "pro") {
    setLoadingPlan(plan);
    startTransition(async () => {
      await createCheckoutSession(plan, yearly ? "yearly" : "monthly");
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg text-[#1A2744]"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          Mudar de plano
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={!yearly ? "text-[#1A2744]" : "text-[#1A2744]/40"}>
            Mensal
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              yearly ? "bg-[#C9A96E]" : "bg-[#1A2744]/15"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                yearly ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span
            className={cn(
              "flex items-center gap-1",
              yearly ? "text-[#1A2744]" : "text-[#1A2744]/40"
            )}
          >
            Anual
            <span className="text-xs bg-[#C9A96E]/15 text-[#C9A96E] px-1.5 py-0.5 rounded-full">
              −15%
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-6 flex flex-col",
                plan.highlight
                  ? "border-[#C9A96E]/40 bg-[#C9A96E]/5"
                  : "border-[#1A2744]/8"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h4
                  className="text-xl text-[#1A2744]"
                  style={{
                    fontFamily: "var(--font-instrument-serif), serif",
                  }}
                >
                  {plan.name}
                </h4>
                {plan.highlight && (
                  <span className="text-xs bg-[#C9A96E] text-[#1A2744] font-semibold px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 mb-5">
                <span
                  className="text-3xl text-[#1A2744]"
                  style={{
                    fontFamily: "var(--font-instrument-serif), serif",
                  }}
                >
                  R${price}
                </span>
                <span className="text-[#1A2744]/40 text-sm mb-1">/mês</span>
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-[#1A2744]/70"
                  >
                    <Check size={14} className="text-[#C9A96E]" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || isPending}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
                  isCurrent
                    ? "bg-[#1A2744]/8 text-[#1A2744]/40 cursor-default"
                    : plan.highlight
                      ? "bg-[#C9A96E] hover:bg-[#D4B882] text-[#1A2744]"
                      : "bg-[#1A2744] hover:bg-[#243255] text-white"
                )}
              >
                {isCurrent
                  ? "Plano atual"
                  : loadingPlan === plan.id && isPending
                    ? "Redirecionando..."
                    : "Assinar"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[#1A2744]/30 text-xs text-center mt-5">
        Precisa de mais? Plano Enterprise sob consulta —{" "}
        <a href="/contact" className="underline">
          fale com vendas
        </a>
      </p>
    </div>
  );
}
