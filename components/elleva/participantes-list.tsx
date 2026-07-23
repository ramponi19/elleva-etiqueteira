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

const PAGE_SIZE = 50;

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
  const [page, setPage] = useState(0);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return participantes.filter(
      (p) =>
        (!evento || p.eventId === evento) &&
        (!term || p.buyerName.toLowerCase().includes(term) || p.buyerEmail.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
    );
  }, [participantes, evento, q]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagina = page > totalPages - 1 ? 0 : page;
  const visiveis = useMemo(
    () => filtrados.slice(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE),
    [filtrados, pagina]
  );

  const input = "rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none focus:border-sol";
  const tom = (p: Participante) => STATUS[p.status] ?? { label: p.status, tom: "papel" as const };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={input} value={evento} onChange={(e) => { setEvento(e.target.value); setPage(0); }}>
          <option value="">Todos os eventos</option>
          {eventos.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <input className={`${input} min-w-[220px] flex-1`} placeholder="Buscar nome, e-mail ou código" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <button
          type="button"
          onClick={() => baixarCsv(filtrados)}
          className="min-h-[44px] rounded-[var(--radius-pill)] bg-tinta px-4 py-2.5 text-[14px] font-medium text-papel hover:bg-sol-escuro"
        >
          Exportar CSV ({filtrados.length})
        </button>
      </div>

      {/* MOBILE — cards empilhados */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {visiveis.map((p) => {
          const s = tom(p);
          return (
            <div key={p.code} className="rounded-[10px] border-[1.5px] border-tinta bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 truncate font-medium text-tinta">{p.buyerName || "—"}</p>
                  <p className="corpo-suave m-0 truncate">{p.buyerEmail}</p>
                </div>
                <Badge tom={s.tom}>{s.label}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-tinta-60">
                <span>{p.eventTitle}</span>
                <span aria-hidden>·</span>
                <span>{p.tierName}</span>
              </div>
              <p className="m-0 mt-1 font-mono text-[12px] text-tinta-60">{p.code}</p>
              {p.status === "used" && p.validadoPor && (
                <p className="corpo-suave m-0 mt-1 text-[12px]">Validado por {p.validadoPor}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP — tabela */}
      <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white sm:block">
        <table className="w-full min-w-[720px] text-[13.5px]">
          <thead>
            <tr className="bg-papel-2 text-left">
              {["Participante", "Evento", "Ingresso", "Código", "Status"].map((h) => (
                <th key={h} className="rotulo px-4 py-3 text-tinta-60">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p, i) => {
              const s = tom(p);
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

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, pagina - 1))}
            disabled={pagina === 0}
            className="min-h-[44px] rounded-[10px] border-[1.5px] border-tinta px-4 text-[14px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="corpo-suave text-[14px]">
            Página {pagina + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages - 1, pagina + 1))}
            disabled={pagina >= totalPages - 1}
            className="min-h-[44px] rounded-[10px] border-[1.5px] border-tinta px-4 text-[14px] font-medium text-tinta hover:bg-papel-2 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
