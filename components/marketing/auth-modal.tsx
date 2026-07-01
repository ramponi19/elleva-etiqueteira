"use client";

import { useState } from "react";
import Icon from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/client";

// Modal de login/cadastro sobre a tela de seleção (fluxo estilo Ingresse).
// Reusa as mesmas chamadas Supabase do /login e /signup.
export default function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error || !data.user) {
        setError("Email ou senha incorretos.");
        return;
      }
      onSuccess();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
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
      if (data.session) onSuccess();
      else setInfo("Conta criada! Confirme seu email para concluir a compra.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <Icon icon="lucide:x" style={{ fontSize: 20 }} />
        </button>

        <div className="modal-tabs">
          <button className={`modal-tab${mode === "login" ? " modal-tab--active" : ""}`} onClick={() => { setMode("login"); setError(null); setInfo(null); }}>
            Entrar
          </button>
          <button className={`modal-tab${mode === "signup" ? " modal-tab--active" : ""}`} onClick={() => { setMode("signup"); setError(null); setInfo(null); }}>
            Criar conta
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px" }}>
          {mode === "login" ? "Entre para concluir sua compra." : "Crie sua conta para concluir a compra."}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label className="field-label">NOME COMPLETO</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div>
            <label className="field-label">E-MAIL</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </div>
          <div>
            <label className="field-label">SENHA</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={mode === "signup" ? 8 : undefined} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#B4291F", background: "rgba(180,41,31,.08)", border: "1px solid rgba(180,41,31,.2)", borderRadius: 10, padding: "8px 12px", margin: 0 }}>{error}</p>
          )}
          {info && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-tint)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", margin: 0 }}>{info}</p>
          )}

          <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar e continuar" : "Criar conta e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
