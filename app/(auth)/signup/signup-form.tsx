"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Este email já está cadastrado. Faça login.");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess(true);
  }

  const inputCls = cn(
    "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm",
    "focus:outline-none focus:border-[#C9A96E]/60 focus:bg-white/10 transition-all"
  );

  if (success) {
    return (
      <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-[#C9A96E]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-[#C9A96E] text-xl">✓</span>
        </div>
        <h2
          className="text-xl text-white mb-2"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          Confirme seu email
        </h2>
        <p className="text-white/50 text-sm">
          Enviamos um link de confirmação para{" "}
          <span className="text-white/80">{email}</span>. Verifique sua caixa
          de entrada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-white/60 text-xs mb-1.5 ml-1">
          Nome completo
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João Silva"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-white/60 text-xs mb-1.5 ml-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-white/60 text-xs mb-1.5 ml-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9A96E] hover:bg-[#D4B882] text-[#1A2744] font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Criando conta..." : "Criar conta gratuita"}
      </button>
    </form>
  );
}
