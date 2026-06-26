import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { Tag, Printer, FileText, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "lá";

  // Today's start (UTC)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: jobsToday },
    { count: jobsCompleted },
    { count: printersOnline },
    { count: templates },
    { data: recentJobs },
  ] = await Promise.all([
    supabase
      .from("print_jobs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("print_jobs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .eq("status", "completed"),
    supabase
      .from("printers")
      .select("*", { count: "exact", head: true })
      .eq("status", "online"),
    supabase
      .from("label_templates")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false),
    supabase
      .from("print_jobs")
      .select("*, label_templates(name), printers(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const successRate =
    jobsToday && jobsToday > 0
      ? Math.round(((jobsCompleted ?? 0) / jobsToday) * 100)
      : null;

  const stats = [
    {
      label: "Jobs hoje",
      value: jobsToday?.toString() ?? "0",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Impressoras online",
      value: printersOnline?.toString() ?? "0",
      icon: Printer,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Modelos ativos",
      value: templates?.toString() ?? "0",
      icon: Tag,
      color: "text-[#C9A96E]",
      bg: "bg-amber-50",
    },
    {
      label: "Taxa de sucesso",
      value: successRate !== null ? `${successRate}%` : "—",
      icon: CheckCircle2,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  const hasOrg = !!(await supabase.rpc("my_org_id")).data;

  return (
    <>
      <Header
        title={`Olá, ${firstName} 👋`}
        description="Resumo da sua operação hoje."
      />

      <main className="p-6 max-w-7xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent jobs */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#1A2744]/8 p-5">
            <h2
              className="text-base text-[#1A2744] mb-4"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Jobs recentes
            </h2>
            {!recentJobs?.length ? (
              <p className="text-[#1A2744]/40 text-sm text-center py-8">
                Nenhum job ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => {
                  const tpl = job.label_templates as { name: string } | null;
                  const prt = job.printers as { name: string } | null;
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between py-2.5 border-b border-[#1A2744]/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-[#1A2744] font-medium">
                          {tpl?.name ?? "—"}
                        </p>
                        <p className="text-xs text-[#1A2744]/40">
                          {prt?.name ?? "—"} · {job.quantity} un.
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          job.status as
                            | "queued"
                            | "processing"
                            | "completed"
                            | "failed"
                            | "cancelled"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Onboarding checklist */}
          {!hasOrg && (
            <div className="bg-[#1A2744] rounded-2xl p-5">
              <h2
                className="text-base text-white mb-1"
                style={{ fontFamily: "var(--font-instrument-serif), serif" }}
              >
                Primeiros passos
              </h2>
              <p className="text-white/40 text-xs mb-5">
                Configure tudo em minutos.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Criar organização", href: "/dashboard/configuracoes" },
                  { label: "Adicionar impressora", href: "/dashboard/impressoras/nova" },
                  { label: "Criar modelo de etiqueta", href: "/dashboard/etiquetas/nova" },
                ].map((step, i) => (
                  <a
                    key={step.label}
                    href={step.href}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-white/30 text-xs flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-white/70 text-sm">{step.label}</span>
                    <span className="ml-auto text-[#C9A96E] text-xs">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
