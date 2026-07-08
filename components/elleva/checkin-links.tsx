"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { regenerateCheckinToken } from "@/lib/actions/tickets";

interface EventLink {
  id: string;
  title: string;
  token: string;
}

// Lista os eventos do produtor com um link de check-in copiável para a equipe.
export function CheckinLinks({ events }: { events: EventLink[] }) {
  const [items, setItems] = useState(events);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = (t: string) => `${origin}/validar/${t}`;

  async function copy(t: string) {
    try {
      await navigator.clipboard.writeText(link(t));
      setCopied(t);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard bloqueado: usuário copia manual */
    }
  }

  async function regen(id: string) {
    setBusy(id);
    const r = await regenerateCheckinToken(id);
    setBusy(null);
    if (r.ok && r.token) setItems((s) => s.map((e) => (e.id === id ? { ...e, token: r.token! } : e)));
  }

  if (!items.length) {
    return <p className="corpo-suave">Crie um evento para gerar o link de check-in da equipe.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((e) => (
        <div key={e.id} className="rounded-[10px] border-[1.5px] border-tinta bg-white p-4">
          <p className="text-[15px] font-medium text-tinta">{e.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={link(e.token)}
              onFocus={(ev) => ev.currentTarget.select()}
              className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-tinta bg-papel-2 px-3 py-2 font-mono text-[12.5px] text-tinta-70"
            />
            <Button type="button" variante="tinta" onClick={() => copy(e.token)}>
              {copied === e.token ? "Copiado!" : "Copiar link"}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => regen(e.id)}
            disabled={busy === e.id}
            className="mt-2 text-[13px] text-sol-escuro underline underline-offset-2 disabled:opacity-50"
          >
            {busy === e.id ? "Gerando..." : "Gerar novo link (revoga o antigo)"}
          </button>
        </div>
      ))}
    </div>
  );
}
