"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este email já está cadastrado. Faça login."
          : error.message
      );
      return;
    }

    // já autenticado (confirmação de email desligada) → vai pra conta
    if (data.session) {
      router.push("/conta");
      router.refresh();
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="auth-success">
        <div className="auth-success__icon">
          <Icon icon="solar:letter-bold" style={{ fontSize: 26, color: "#fff" }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, margin: "0 0 6px" }}>
          Confirme seu email
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Enviamos um link de confirmação para <strong>{email}</strong>. Verifique sua caixa de entrada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="field-label">NOME COMPLETO</label>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required />
      </div>
      <div>
        <label className="field-label">E-MAIL</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>
      <div>
        <label className="field-label">SENHA</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ marginTop: 6 }}>
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
