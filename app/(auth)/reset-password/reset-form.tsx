"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    router.push("/conta");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="field-label">NOVA SENHA</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ marginTop: 6 }}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
