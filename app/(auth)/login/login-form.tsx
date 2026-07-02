"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    const role = profile?.role ?? "customer";
    const dest = role === "admin" ? "/admin" : role === "producer" ? "/produtor" : "/conta";
    router.push(dest);
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Digite seu email para receber o link de acesso.");
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });
    setLoading(false);
    if (error) setError("Não foi possível enviar o link. Tente novamente.");
    else setInfo(`Link de acesso enviado para ${email}.`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="field-label">E-MAIL</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <label className="field-label">SENHA</label>
          <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Esqueceu?</Link>
        </div>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>

      {error && <p className="auth-error">{error}</p>}
      {info && <p className="auth-info">{info}</p>}

      <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ marginTop: 6 }}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <div className="auth-divider"><span>ou</span></div>

      <button type="button" className="btn btn-ghost btn-block" onClick={handleMagicLink} disabled={loading}>
        Receber link por email
      </button>
    </form>
  );
}
