"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Modal de login/cadastro sobre a tela de seleção (fluxo estilo Ingresse).
// Reusa as mesmas chamadas Supabase do /login e /signup — visual Cartaz de Show.
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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

  const inputCls =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-3 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
  const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-tinta-60";
  const tab = (ativo: boolean) =>
    `min-h-[44px] flex-1 border-b-[2px] px-3 text-[15px] font-medium transition-colors ${
      ativo ? "border-sol text-tinta" : "border-transparent text-tinta-60 hover:text-tinta"
    }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(20_18_16/0.55)] p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[400px] rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-6 shadow-[4px_4px_0_var(--color-tinta)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-[8px] text-tinta-60 hover:bg-papel-2 hover:text-tinta"
        >
          <Icon icon="lucide:x" style={{ fontSize: 20 }} />
        </button>

        <div className="mb-4 mt-1 flex border-b-[1.5px] border-tinta">
          <button type="button" className={tab(mode === "login")} onClick={() => { setMode("login"); setError(null); setInfo(null); }}>
            Entrar
          </button>
          <button type="button" className={tab(mode === "signup")} onClick={() => { setMode("signup"); setError(null); setInfo(null); }}>
            Criar conta
          </button>
        </div>

        <p className="corpo-suave m-0 mb-5">
          {mode === "login" ? "Entre para concluir sua compra." : "Crie sua conta para concluir a compra."}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          {mode === "signup" && (
            <div>
              <label className={labelCls}>Nome completo</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div>
            <label className={labelCls}>E-mail</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </div>
          <div>
            <label className={labelCls}>Senha</label>
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={mode === "signup" ? 8 : undefined} />
          </div>

          {error && (
            <p className="m-0 rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3 py-2 text-[13px] text-sol-escuro">{error}</p>
          )}
          {info && (
            <p className="m-0 rounded-[10px] border-[1.5px] border-dashed border-tinta bg-papel-2 px-3 py-2 text-[13px] text-tinta">{info}</p>
          )}

          <Button type="submit" variante="primario" disabled={loading} className="mt-1 w-full">
            {loading ? "Aguarde..." : mode === "login" ? "Entrar e continuar" : "Criar conta e continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
