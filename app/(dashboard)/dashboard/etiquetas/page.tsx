import Link from "next/link";
import { Plus, Tag, Archive, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { archiveTemplate } from "@/lib/actions/templates";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Etiquetas" };

export default async function EtiquetasPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("label_templates")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header
        title="Modelos de Etiqueta"
        description="Crie e gerencie seus templates de impressão."
      />

      <main className="p-6 max-w-7xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#1A2744]/50 text-sm">
            {templates?.length ?? 0} modelo{templates?.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/dashboard/etiquetas/nova"
            className="inline-flex items-center gap-2 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Novo modelo
          </Link>
        </div>

        {!templates?.length ? (
          <EmptyState
            icon={Tag}
            title="Nenhum modelo ainda"
            description="Crie seu primeiro modelo de etiqueta para começar a imprimir."
            actionLabel="Criar modelo"
            actionHref="/dashboard/etiquetas/nova"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="group bg-white rounded-2xl border border-[#1A2744]/8 p-5 hover:border-[#C9A96E]/40 hover:shadow-md transition-all"
              >
                {/* Format badge */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-[#1A2744]/6 text-[#1A2744]/60 px-2.5 py-1 rounded-full">
                    {t.format}
                  </span>
                  <span className="text-xs text-[#1A2744]/30">
                    v{t.version}
                  </span>
                </div>

                {/* Name */}
                <h3
                  className="text-lg text-[#1A2744] leading-snug mb-1"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {t.name}
                </h3>
                {t.description && (
                  <p className="text-[#1A2744]/50 text-xs line-clamp-2 mb-3">
                    {t.description}
                  </p>
                )}

                {/* Dimensions */}
                <p className="text-xs text-[#1A2744]/40 mb-4">
                  {t.width_mm} × {t.height_mm} mm
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#1A2744]/6">
                  <Link
                    href={`/dashboard/etiquetas/${t.id}`}
                    className="flex items-center gap-1.5 text-xs text-[#1A2744]/50 hover:text-[#1A2744] transition-colors"
                  >
                    <Pencil size={12} />
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await archiveTemplate(t.id);
                    }}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-xs text-[#1A2744]/30 hover:text-[#1A2744]/60 transition-colors"
                    >
                      <Archive size={12} />
                      Arquivar
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
