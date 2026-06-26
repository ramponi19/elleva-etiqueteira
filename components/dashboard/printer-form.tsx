"use client";

import { useActionState } from "react";
import type { Printer } from "@/types";
import type { PrinterFormState } from "@/lib/actions/printers";

interface Props {
  action: (
    prev: PrinterFormState,
    formData: FormData
  ) => Promise<PrinterFormState>;
  printer?: Printer;
}

const inputCls =
  "w-full border border-[#1A2744]/15 rounded-xl px-4 py-2.5 text-[#1A2744] text-sm placeholder-[#1A2744]/30 focus:outline-none focus:border-[#C9A96E]/60 transition-all bg-white";

export function PrinterForm({ action, printer }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Nome *
          </label>
          <input
            name="name"
            defaultValue={printer?.name}
            placeholder="Impressora linha A"
            required
            className={inputCls}
          />
          {state.errors?.name && (
            <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Modelo
          </label>
          <input
            name="model"
            defaultValue={printer?.model ?? ""}
            placeholder="Zebra ZT230"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Endereço IP
          </label>
          <input
            name="ip_address"
            defaultValue={printer?.ip_address ?? ""}
            placeholder="192.168.1.100"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            DPI
          </label>
          <select
            name="dpi"
            defaultValue={printer?.dpi ?? 203}
            className={inputCls}
          >
            <option value={203}>203 dpi</option>
            <option value={300}>300 dpi</option>
            <option value={600}>600 dpi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Localização
          </label>
          <input
            name="location"
            defaultValue={printer?.location ?? ""}
            placeholder="Galpão B - Linha 3"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Nº de série
          </label>
          <input
            name="serial_number"
            defaultValue={printer?.serial_number ?? ""}
            placeholder="ZB0001234"
            className={inputCls}
          />
        </div>
      </div>

      {state.message && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {pending
            ? "Salvando..."
            : printer
              ? "Salvar alterações"
              : "Adicionar impressora"}
        </button>
        <a
          href="/dashboard/impressoras"
          className="text-sm text-[#1A2744]/50 hover:text-[#1A2744] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
