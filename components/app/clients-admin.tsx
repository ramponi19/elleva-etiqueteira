"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import RoleSelect from "@/components/app/role-select";
import { downloadCsv, csvDate } from "@/lib/csv";
import type { Role } from "@/lib/actions/admin";

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  created_at: string;
}

export default function ClientsAdmin({ users, truncated }: { users: AdminUser[]; truncated: boolean }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(t) || (u.email ?? "").toLowerCase().includes(t));
  }, [users, q]);

  function exportCsv() {
    downloadCsv(
      "clientes-elleva.csv",
      ["Cadastro", "Nome", "E-mail", "Papel"],
      filtered.map((u) => [csvDate(u.created_at), u.full_name ?? "", u.email ?? "", u.role])
    );
  }

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="min-w-[220px] flex-1 rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[14px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="inline-flex min-h-[42px] items-center rounded-[10px] border-[1.5px] border-tinta px-4 text-[13px] font-medium text-tinta transition-colors hover:bg-papel-2 disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <p className="corpo-suave mb-3">
        {filtered.length} usuário(s){q ? ` de ${users.length}` : ""}{truncated && " — mostrando os 1000 mais recentes"}
      </p>

      <div className={card}>
        {filtered.map((u, i) => (
          <div key={u.id} className={clsx("flex flex-wrap items-center justify-between gap-3 px-5 py-3.5", i && "border-t-[1.5px] border-dashed border-tinta")}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-tinta text-[12px] font-bold text-papel">
                {(u.full_name || u.email || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate text-[14px] font-medium text-tinta">{u.full_name || "Sem nome"}</p>
                <p className="corpo-suave m-0 truncate text-[12.5px]">{u.email ?? "e-mail indisponível"}</p>
              </div>
            </div>
            <RoleSelect userId={u.id} current={u.role} />
          </div>
        ))}
        {!filtered.length && <p className="corpo-suave px-5 py-12 text-center">Nenhum usuário encontrado.</p>}
      </div>
    </div>
  );
}
