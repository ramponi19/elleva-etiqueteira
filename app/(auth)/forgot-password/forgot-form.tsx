"use client";

import { useState } from "react";
import Icon from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/client";

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
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
      <div className="auth-success">
        <div className="auth-success__icon">
          <Icon icon="solar:letter-bold" style={{ fontSize: 26, color: "#fff" }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, margin: "0 0 6px" }}>
          Verifique seu email
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Enviamos um link de redefinição para <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="field-label">E-MAIL</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ marginTop: 6 }}>
        {loading ? "Enviando..." : "Enviar link"}
      </button>
    </form>
  );
}
