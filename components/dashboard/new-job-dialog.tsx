"use client";

import { useState, useActionState } from "react";
import { Plus, X } from "lucide-react";
import { createJob } from "@/lib/actions/jobs";
import { cn } from "@/lib/utils";

interface Props {
  templates: { id: string; name: string }[];
  printers: { id: string; name: string; status: string }[];
}

const inputCls =
  "w-full border border-[#1A2744]/15 rounded-xl px-4 py-2.5 text-[#1A2744] text-sm bg-white focus:outline-none focus:border-[#C9A96E]/60 transition-all";

export function NewJobDialog({ templates, printers }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createJob, {});

  if (state.success && open) {
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
      >
        <Plus size={15} />
        Novo job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl text-[#1A2744]"
                style={{ fontFamily: "var(--font-instrument-serif), serif" }}
              >
                Novo Job de Impressão
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#1A2744]/30 hover:text-[#1A2744] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
                  Modelo de etiqueta *
                </label>
                <select name="template_id" required className={inputCls}>
                  <option value="">Selecione...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {state.errors?.template_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.template_id[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
                  Impressora *
                </label>
                <select name="printer_id" required className={inputCls}>
                  <option value="">Selecione...</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{" "}
                      {p.status === "online" ? "● online" : "○ offline"}
                    </option>
                  ))}
                </select>
                {state.errors?.printer_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.printer_id[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
                  Quantidade *
                </label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={9999}
                  defaultValue={1}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
                  Variáveis (JSON)
                </label>
                <textarea
                  name="variables_data"
                  placeholder='{"produto": "ABC-001", "lote": "L2024"}'
                  rows={3}
                  className={cn(inputCls, "font-mono text-xs resize-none")}
                />
                <p className="text-[#1A2744]/30 text-xs mt-1 ml-1">
                  Opcional — sobreescreve variáveis do template.
                </p>
              </div>

              {state.message && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {state.message}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {pending ? "Enviando..." : "Enviar para fila"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm text-[#1A2744]/50 hover:text-[#1A2744] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
