import Link from "next/link";
import { Plus, Printer, MapPin, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { deletePrinter } from "@/lib/actions/printers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressoras" };

export default async function ImpressorasPage() {
  const supabase = await createClient();
  const { data: printers } = await supabase
    .from("printers")
    .select("*")
    .order("created_at", { ascending: false });

  const online = printers?.filter((p) => p.status === "online").length ?? 0;

  return (
    <>
      <Header
        title="Impressoras"
        description={`${online} online · ${printers?.length ?? 0} total`}
      />

      <main className="p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#1A2744]/50 text-sm">
            {printers?.length ?? 0} impressora
            {printers?.length !== 1 ? "s" : ""} cadastrada
            {printers?.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/dashboard/impressoras/nova"
            className="inline-flex items-center gap-2 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Adicionar impressora
          </Link>
        </div>

        {!printers?.length ? (
          <EmptyState
            icon={Printer}
            title="Nenhuma impressora cadastrada"
            description="Adicione suas impressoras para começar a enviar jobs de impressão."
            actionLabel="Adicionar impressora"
            actionHref="/dashboard/impressoras/nova"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {printers.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#1A2744]/8 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-[#1A2744]/5 rounded-xl flex items-center justify-center">
                    {p.status === "online" ? (
                      <Wifi size={18} className="text-green-500" />
                    ) : (
                      <WifiOff size={18} className="text-[#1A2744]/25" />
                    )}
                  </div>
                  <StatusBadge status={p.status as "online" | "offline" | "error" | "busy"} />
                </div>

                <h3
                  className="text-base text-[#1A2744] font-medium mb-0.5"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {p.name}
                </h3>
                {p.model && (
                  <p className="text-[#1A2744]/40 text-xs mb-2">{p.model}</p>
                )}

                <div className="space-y-1 mb-4">
                  {p.location && (
                    <div className="flex items-center gap-1.5 text-[#1A2744]/40 text-xs">
                      <MapPin size={11} />
                      {p.location}
                    </div>
                  )}
                  {p.ip_address && (
                    <p className="text-[#1A2744]/30 text-xs font-mono">
                      {p.ip_address}
                    </p>
                  )}
                  <p className="text-[#1A2744]/30 text-xs">{p.dpi} dpi</p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#1A2744]/6">
                  <Link
                    href={`/dashboard/impressoras/${p.id}`}
                    className="text-xs text-[#1A2744]/50 hover:text-[#1A2744] transition-colors"
                  >
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deletePrinter(p.id);
                    }}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-400/70 hover:text-red-500 transition-colors"
                    >
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
