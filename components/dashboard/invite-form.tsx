"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember } from "@/lib/actions/members";

const inputCls =
  "w-full border border-[#1A2744]/15 rounded-xl px-4 py-2.5 text-[#1A2744] text-sm bg-white focus:outline-none focus:border-[#C9A96E]/60 transition-all";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMember, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            name="email"
            type="email"
            placeholder="colega@empresa.com"
            required
            className={inputCls}
          />
          {state.errors?.email && (
            <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>
          )}
        </div>
        <select name="role" defaultValue="member" className={`${inputCls} sm:w-40`}>
          <option value="admin">Administrador</option>
          <option value="member">Membro</option>
          <option value="viewer">Visualizador</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <UserPlus size={15} />
          {pending ? "Enviando..." : "Convidar"}
        </button>
      </div>

      {state.success && (
        <p className="text-green-600 text-xs bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          {state.message ?? "Convite enviado com sucesso!"}
        </p>
      )}
      {state.message && !state.success && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {state.message}
        </p>
      )}
    </form>
  );
}
