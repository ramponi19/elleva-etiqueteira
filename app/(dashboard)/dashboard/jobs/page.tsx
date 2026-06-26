import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { cancelJob } from "@/lib/actions/jobs";
import { NewJobDialog } from "@/components/dashboard/new-job-dialog";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: templates }, { data: printers }] =
    await Promise.all([
      supabase
        .from("print_jobs")
        .select(
          "*, label_templates(name), printers(name)"
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("label_templates")
        .select("id, name")
        .eq("is_archived", false),
      supabase.from("printers").select("id, name, status"),
    ]);

  return (
    <>
      <Header
        title="Jobs de Impressão"
        description="Fila e histórico de impressões."
      />

      <main className="p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#1A2744]/50 text-sm">
            {jobs?.length ?? 0} job{jobs?.length !== 1 ? "s" : ""}
          </p>
          <NewJobDialog
            templates={templates ?? []}
            printers={printers ?? []}
          />
        </div>

        {!jobs?.length ? (
          <EmptyState
            icon={FileText}
            title="Nenhum job ainda"
            description="Envie seu primeiro job de impressão."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#1A2744]/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2744]/6">
                  <th className="text-left px-5 py-3.5 text-[#1A2744]/40 text-xs font-medium">
                    Modelo
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#1A2744]/40 text-xs font-medium hidden md:table-cell">
                    Impressora
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#1A2744]/40 text-xs font-medium">
                    Qtd
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#1A2744]/40 text-xs font-medium">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#1A2744]/40 text-xs font-medium hidden lg:table-cell">
                    Criado
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2744]/4">
                {jobs.map((job) => {
                  const template = job.label_templates as { name: string } | null;
                  const printer = job.printers as { name: string } | null;
                  return (
                    <tr key={job.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-5 py-3.5 text-[#1A2744] font-medium">
                        {template?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[#1A2744]/60 hidden md:table-cell">
                        {printer?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[#1A2744]/60">
                        {job.quantity}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={job.status as "queued" | "processing" | "completed" | "failed" | "cancelled"} />
                      </td>
                      <td className="px-5 py-3.5 text-[#1A2744]/40 text-xs hidden lg:table-cell">
                        {new Date(job.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        {job.status === "queued" && (
                          <form
                            action={async () => {
                              "use server";
                              await cancelJob(job.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-[#1A2744]/30 hover:text-red-500 transition-colors"
                            >
                              Cancelar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
