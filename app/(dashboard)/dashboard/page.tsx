import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { Tag, Printer, FileText, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "lá";

  // Stats cards — will be real queries after org setup
  const stats = [
    {
      label: "Jobs hoje",
      value: "—",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Impressoras online",
      value: "—",
      icon: Printer,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Modelos ativos",
      value: "—",
      icon: Tag,
      color: "text-[#C9A96E]",
      bg: "bg-amber-50",
    },
    {
      label: "Taxa de sucesso",
      value: "—",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <>
      <Header
        title={`Olá, ${firstName} 👋`}
        description="Aqui está o resumo da sua operação hoje."
      />

      <main className="p-6 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-[#1A2744]/8 p-5"
              >
                <div
                  className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
                >
                  <Icon size={18} className={stat.color} />
                </div>
                <p className="text-[#1A2744]/50 text-xs mb-0.5">{stat.label}</p>
                <p
                  className="text-2xl text-[#1A2744]"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Onboarding checklist */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <h2
            className="text-xl text-white mb-1"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Configure sua operação
          </h2>
          <p className="text-white/40 text-sm mb-6">
            Complete os passos abaixo para começar a imprimir.
          </p>

          <div className="space-y-3">
            {[
              { label: "Criar modelo de etiqueta", href: "/dashboard/etiquetas/nova", done: false },
              { label: "Adicionar impressora", href: "/dashboard/impressoras", done: false },
              { label: "Configurar organização", href: "/dashboard/configuracoes", done: false },
            ].map((step, i) => (
              <div
                key={step.label}
                className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                      step.done
                        ? "bg-[#C9A96E] border-[#C9A96E] text-[#1A2744]"
                        : "border-white/20 text-white/30"
                    }`}
                  >
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span className="text-white/70 text-sm">{step.label}</span>
                </div>
                <a
                  href={step.href}
                  className="text-[#C9A96E] text-xs hover:text-[#D4B882] transition-colors"
                >
                  Configurar →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
