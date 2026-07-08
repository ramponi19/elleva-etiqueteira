"use client";

import { useState } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o link. Tente novamente.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tinta text-papel">
          <Icon icon="solar:letter-bold" style={{ fontSize: 24 }} />
        </span>
        <h2 className="mt-4 text-[20px] font-extrabold text-tinta">Verifique seu email</h2>
        <p className="corpo-suave mt-1">
          Enviamos um link de redefinição para <strong className="text-tinta">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div>
        <label className={label}>E-mail</label>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>
      {error && <p className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px] text-sol-escuro">{error}</p>}
      <Button type="submit" variante="primario" className="mt-1 w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
