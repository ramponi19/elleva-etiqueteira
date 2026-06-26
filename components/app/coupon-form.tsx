"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoupon } from "@/lib/actions/admin";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = { fontSize: 14, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-elevated)", color: "var(--text-primary)" } as const;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createCoupon({
      code,
      discountType: type,
      discountValue: Number(value),
      maxUses: maxUses ? Number(maxUses) : undefined,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Erro"); return; }
    setCode(""); setValue(""); setMaxUses("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <input style={{ ...input, fontFamily: "var(--font-mono)", textTransform: "uppercase", width: 140 }} placeholder="CÓDIGO" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      <select style={input} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
        <option value="percent">% percentual</option>
        <option value="fixed">R$ fixo</option>
      </select>
      <input style={{ ...input, width: 110 }} type="number" placeholder={type === "percent" ? "Ex: 10" : "Ex: 20"} value={value} onChange={(e) => setValue(e.target.value)} />
      <input style={{ ...input, width: 130 }} type="number" placeholder="Usos (opc.)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
      <button className="btn btn-gold btn-md" disabled={loading} type="submit">{loading ? "..." : "Criar cupom"}</button>
      {error && <span style={{ fontSize: 13, color: "#d64545", width: "100%" }}>{error}</span>}
    </form>
  );
}
