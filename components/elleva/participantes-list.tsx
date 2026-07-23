"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";

export interface Participante {
  code: string;
  status: string;
  eventId: string;
  eventTitle: string;
  tierName: string;
  usedAt: string | null;
  validadoPor: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string;
}

const STATUS: Record<string, { label: string; tom: "sol" | "papel" | "tinta" }> = {
  valid: { label: "Válido", tom: "sol" },
  used: { label: "Check-in feito", tom: "papel" },
  cancelled: { label: "Cancelado", tom: "tinta" },
};

function baixarCsv(rows: Participante[]) {
  const head = ["Nome", "E-mail", "WhatsApp", "Evento", "Ingresso", "Código", "Status", "Check-in em", "Validado por"];
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const linhas = rows.map((r) =>
    [r.buyerName, r.buyerEmail, r.buyerWhatsapp, r.eventTitle, r.tierName, r.code,
     STATUS[r.status]?.label ?? r.status, r.usedAt ? new Date(r.usedAt).toLocaleString("pt-BR") : "", r.validadoPor]
      .map(esc).join(",")
  );
  const csv = "﻿" + [head.map(esc).join(","), ...linhas].join("\r\n"); // BOM p/ Excel
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `participantes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ParticipantesList({
  participantes,
  eventos,
}: {
  participantes: Participante[];
  eventos: { id: string; title: string }[];
}) {
  const [evento, setEvento] = useState("");
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return participantes.filter(
      (p) =>
        (!evento || p.eventId === evento) &&
        (!term || p.buyerName.toLowerCase().includes(term) || p.buyerEmail.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
    );
  }, [participantes, evento, q]);

  const input = "rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none focus:border-sol";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={input} value={evento} onChange={(e) => setEvento(e.target.value)}>
          <option value="">Todos os eventos</option>
          {eventos.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <input className={`${input} min-w-[220px] flex-1`} placeholder="Buscar nome, e-mail ou código" value={q} onChange={(e) => setQ(e.target.value)} />
        <button
          type="button"
          onClick={() => baixarCsv(filtrados)}
          className="rounded-[var(--radius-pill)] bg-tinta px-4 py-2.5 text-[14px] font-medium text-papel hover:bg-sol-escuro"
        >
          Exportar CSV ({filtrados.length})
        </button>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white">
        <table className="w-full min-w-[720px] text-[13.5px]">
          <thead>
            <tr className="bg-papel-2 text-left">
              {["Participante", "Evento", "Ingresso", "Código", "Status"].map((h) => (
                <th key={h} className="rotulo px-4 py-3 text-tinta-60">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => {
              const s = STATUS[p.status] ?? { label: p.status, tom: "papel" as const };
              return (
                <tr key={p.code} className={clsx(i && "border-t-[1.5px] border-dashed border-tinta")}>
                  <td className="px-4 py-3">
                    <p className="m-0 font-medium text-tinta">{p.buyerName || "—"}</p>
                    <p className="corpo-suave m-0">{p.buyerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-tinta-60">{p.eventTitle}</td>
                  <td className="px-4 py-3 text-tinta-60">{p.tierName}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-tinta-60">{p.code}</td>
                  <td className="px-4 py-3">
                    <Badge tom={s.tom}>{s.label}</Badge>
                    {p.status === "used" && p.validadoPor && (
                      <p className="corpo-suave m-0 mt-1 text-[12px]">por {p.validadoPor}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!filtrados.length && <p className="corpo-suave mt-4 text-center">Nenhum participante com esse filtro.</p>}
    </div>
  );
}
