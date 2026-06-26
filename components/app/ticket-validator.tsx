"use client";

import { useState } from "react";
import Icon from "@/components/shared/icon";
import { validateTicket, type ValidateResult } from "@/lib/actions/tickets";

export default function TicketValidator() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const res = await validateTicket(code);
    setLoading(false);
    setResult(res);
    if (res.ok) setCode("");
  }

  const ok = result?.ok;
  const color = !result ? "" : ok ? "#1f9d55" : result.reason === "used" ? "#C6A86A" : "#d64545";

  return (
    <div style={{ maxWidth: 460 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          placeholder="ELV-XXXXXXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
        />
        <button className="btn btn-navy btn-md" disabled={loading} type="submit">
          {loading ? "..." : "Validar"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 20,
            borderRadius: "var(--r-xl)",
            border: `1.5px solid ${color}`,
            background: "var(--bg-elevated)",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <Icon
            icon={ok ? "solar:check-circle-bold" : result.reason === "used" ? "solar:danger-triangle-bold" : "solar:close-circle-bold"}
            style={{ fontSize: 40, color, flexShrink: 0 }}
          />
          <div>
            {ok ? (
              <>
                <p style={{ fontWeight: 700, color, margin: 0 }}>Entrada liberada ✓</p>
                <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "2px 0 0" }}>
                  {result.eventTitle} · {result.tierName}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>{result.code}</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 700, color, margin: 0 }}>{result.message}</p>
                {result.reason === "used" && result.usedAt && (
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                    Utilizado em {new Date(result.usedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon icon="solar:info-circle-bold-duotone" style={{ fontSize: 15 }} />
        Digite ou cole o código do ingresso. Leitura por câmera entra em breve.
      </p>
    </div>
  );
}
