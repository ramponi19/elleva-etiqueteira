"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCoupon } from "@/lib/actions/admin";

const field =
  "rounded-[10px] border-[1.5px] border-tinta bg-white px-3 py-2 text-[16px] text-tinta outline-none focus:border-sol";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!res.ok) {
      setError(res.error ?? "Erro");
      return;
    }
    setCode("");
    setValue("");
    setMaxUses("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2.5">
      <input
        className={`${field} w-[140px] font-mono uppercase`}
        placeholder="CÓDIGO"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <select className={field} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
        <option value="percent">% percentual</option>
        <option value="fixed">R$ fixo</option>
      </select>
      <input className={`${field} w-[110px]`} type="number" placeholder={type === "percent" ? "Ex: 10" : "Ex: 20"} value={value} onChange={(e) => setValue(e.target.value)} />
      <input className={`${field} w-[130px]`} type="number" placeholder="Usos (opc.)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
      <Button type="submit" variante="primario" disabled={loading}>
        {loading ? "..." : "Criar cupom"}
      </Button>
      {error && <span className="w-full text-[13px] text-sol-escuro">{error}</span>}
    </form>
  );
}
