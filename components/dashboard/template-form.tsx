"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import type { LabelTemplate } from "@/types";
import type { TemplateFormState } from "@/lib/actions/templates";

interface Props {
  action: (
    prev: TemplateFormState,
    formData: FormData
  ) => Promise<TemplateFormState>;
  template?: LabelTemplate;
}

const inputCls =
  "w-full border border-[#1A2744]/15 rounded-xl px-4 py-2.5 text-[#1A2744] text-sm placeholder-[#1A2744]/30 focus:outline-none focus:border-[#C9A96E]/60 transition-all bg-white";

export function TemplateForm({ action, template }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
          Nome do modelo *
        </label>
        <input
          name="name"
          defaultValue={template?.name}
          placeholder="Ex: Etiqueta produto acabado"
          required
          className={inputCls}
        />
        {state.errors?.name && (
          <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
          Descrição
        </label>
        <input
          name="description"
          defaultValue={template?.description ?? ""}
          placeholder="Opcional"
          className={inputCls}
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Largura (mm) *
          </label>
          <input
            name="width_mm"
            type="number"
            step="0.1"
            defaultValue={template?.width_mm ?? ""}
            placeholder="100"
            required
            className={inputCls}
          />
          {state.errors?.width_mm && (
            <p className="text-red-500 text-xs mt-1">
              {state.errors.width_mm[0]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Altura (mm) *
          </label>
          <input
            name="height_mm"
            type="number"
            step="0.1"
            defaultValue={template?.height_mm ?? ""}
            placeholder="50"
            required
            className={inputCls}
          />
          {state.errors?.height_mm && (
            <p className="text-red-500 text-xs mt-1">
              {state.errors.height_mm[0]}
            </p>
          )}
        </div>
      </div>

      {/* Format */}
      <div>
        <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
          Formato *
        </label>
        <select
          name="format"
          defaultValue={template?.format ?? "zpl"}
          className={cn(inputCls, "cursor-pointer")}
        >
          <option value="zpl">ZPL (Zebra)</option>
          <option value="pdf">PDF</option>
          <option value="png">PNG</option>
        </select>
      </div>

      {/* Content */}
      <div>
        <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
          Conteúdo do template *
        </label>
        <textarea
          name="content"
          defaultValue={template?.content ?? ""}
          placeholder={`^XA\n^FO50,50^A0N,30,30^FDNome: {{nome}}^FS\n^XZ`}
          required
          rows={8}
          className={cn(inputCls, "font-mono text-xs resize-y")}
        />
        {state.errors?.content && (
          <p className="text-red-500 text-xs mt-1">{state.errors.content[0]}</p>
        )}
        <p className="text-[#1A2744]/30 text-xs mt-1.5 ml-1">
          Use {"{{variavel}}"} para campos dinâmicos.
        </p>
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
            : template
              ? "Salvar alterações"
              : "Criar modelo"}
        </button>
        <a
          href="/dashboard/etiquetas"
          className="text-sm text-[#1A2744]/50 hover:text-[#1A2744] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
