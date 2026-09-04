"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { emailHasAccount } from "@/lib/actions/auth";
import { CADASTRO_NOVO_KEY } from "@/components/elleva/completar-cadastro";

// Modal de login/cadastro sobre a tela de seleção (fluxo estilo Ingresse).
// Reusa as mesmas chamadas Supabase do /login e /signup — visual Cartaz de Show.
export default function AuthModal({
  onClose,
  onSuccess,
  contexto = "compra",
}: {
  onClose: () => void;
  onSuccess: () => void;
  /** "compra" = dentro do fluxo de ingresso; "geral" = botão Entrar do cabeçalho */
  contexto?: "compra" | "geral";
}) {
  const compra = contexto === "compra";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [semConta, setSemConta] = useState(false);

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
      if (error || !data.user) {
        // Decisão de produto: distinguir "não tem conta" de "senha errada" e
        // oferecer o cadastro (checagem server-side, rate-limitada por IP).
        const chk = await emailHasAccount(email);
        setLoading(false);
        if ("exists" in chk && !chk.exists) {
          setSemConta(true);
          setError("Não encontramos uma conta com esse e-mail.");
        } else if ("exists" in chk && chk.exists) {
          setSemConta(false);
          setError("Senha incorreta.");
        } else {
          setSemConta(false);
          setError("Email ou senha incorretos.");
        }
        return;
      }
      setLoading(false);
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
      // Conta nova → o portão global abre "Complete seu cadastro" (CPF etc.) assim
      // que a sessão existir (agora, ou depois da confirmação por e-mail).
      try { sessionStorage.setItem(CADASTRO_NOVO_KEY, "1"); } catch { /* ignore */ }
      if (data.session) onSuccess();
      else setInfo(compra ? "Conta criada! Confirme seu email para concluir a compra." : "Conta criada! Confirme seu email para entrar.");
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
      className="eauth fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(8_7_10/0.72)] p-5"
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
          {mode === "login"
            ? compra ? "Entre para concluir sua compra." : "Entre na sua conta Elleva."
            : compra ? "Crie sua conta para concluir a compra." : "Crie sua conta — leva menos de um minuto."}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          {mode === "signup" && (
            <div>
              <label className={labelCls} htmlFor="am-nome">Nome completo</label>
              <input id="am-nome" name="name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div>
            <label className={labelCls} htmlFor="am-email">E-mail</label>
            <input id="am-email" name="email" autoComplete="email" className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </div>
          <div>
            <label className={labelCls} htmlFor="am-senha">Senha</label>
            <input id="am-senha" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={mode === "signup" ? 8 : undefined} />
          </div>

          {error && (
            <div className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3 py-2 text-[13px]">
              <p className="m-0 text-sol-escuro">{error}</p>
              {mode === "login" && (
                // Atalho pra quem não tem conta: pula pro cadastro com o e-mail já
                // preenchido. Sem revelar se o e-mail existe (anti-enumeração).
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); setInfo(null); setSemConta(false); }}
                  className="mt-1.5 block cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-tinta underline underline-offset-2 hover:text-sol-escuro"
                >
                  {semConta ? "Deseja se cadastrar? Criar conta →" : "Ainda não tem conta? Criar conta →"}
                </button>
              )}
            </div>
          )}
          {info && (
            <p className="m-0 rounded-[10px] border-[1.5px] border-dashed border-tinta bg-papel-2 px-3 py-2 text-[13px] text-tinta">{info}</p>
          )}

          <Button type="submit" variante="primario" disabled={loading} className="mt-1 w-full">
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? compra ? "Entrar e continuar" : "Entrar"
                : compra ? "Criar conta e continuar" : "Criar conta"}
          </Button>
        </form>
      </div>
    </div>
  );
}
