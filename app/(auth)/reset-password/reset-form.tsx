"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60";

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Não foi possível redefinir. O link pode ter expirado — peça um novo.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div>
        <label className={label}>Nova senha</label>
        <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
      </div>
      {error && <p className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px] text-sol-escuro">{error}</p>}
      <Button type="submit" variante="primario" className="mt-1 w-full" disabled={loading}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
