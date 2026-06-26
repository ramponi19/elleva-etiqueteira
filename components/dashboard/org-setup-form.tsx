"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  existingOrg: { id: string; name: string; slug: string } | null;
}

const inputCls =
  "w-full border border-[#1A2744]/15 rounded-xl px-4 py-2.5 text-[#1A2744] text-sm bg-white focus:outline-none focus:border-[#C9A96E]/60 transition-all";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function OrgSetupForm({ userId, existingOrg }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(existingOrg?.name ?? "");
  const [slug, setSlug] = useState(existingOrg?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!existingOrg) setSlug(toSlug(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const supabase = createClient();

      if (existingOrg) {
        const { error } = await supabase
          .from("organizations")
          .update({ name })
          .eq("id", existingOrg.id);
        if (error) { setError(error.message); return; }
      } else {
        const { data: org, error: orgErr } = await supabase
          .from("organizations")
          .insert({ name, slug })
          .select("id")
          .single();
        if (orgErr) {
          setError(
            orgErr.message.includes("unique")
              ? "Esse identificador já está em uso. Escolha outro."
              : orgErr.message
          );
          return;
        }
        const { error: profErr } = await supabase
          .from("profiles")
          .update({ org_id: org.id, role: "owner" })
          .eq("id", userId);
        if (profErr) { setError(profErr.message); return; }
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
          Nome da empresa *
        </label>
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Indústria Alfa S.A."
          required
          className={inputCls}
        />
      </div>

      {!existingOrg && (
        <div>
          <label className="block text-[#1A2744]/60 text-xs mb-1.5 ml-1">
            Identificador (slug)
          </label>
          <div className="flex items-center border border-[#1A2744]/15 rounded-xl overflow-hidden focus-within:border-[#C9A96E]/60 transition-all">
            <span className="px-3 text-[#1A2744]/30 text-sm bg-[#1A2744]/3 border-r border-[#1A2744]/10 py-2.5 select-none">
              elleva.app/
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(toSlug(e.target.value))}
              placeholder="industria-alfa"
              required
              className="flex-1 px-3 py-2.5 text-sm text-[#1A2744] bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-xs bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          Salvo com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? "Salvando..." : existingOrg ? "Salvar" : "Criar organização"}
      </button>
    </form>
  );
}
