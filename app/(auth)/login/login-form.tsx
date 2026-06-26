"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Redireciona conforme o papel
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
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o link. Tente novamente.");
    } else {
      setError(null);
      alert(`Link de acesso enviado para ${email}`);
    }
  }

  const inputCls = cn(
    "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm",
    "focus:outline-none focus:border-[#C9A96E]/60 focus:bg-white/10 transition-all"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-white/60 text-xs ml-1">Senha</label>
          <Link
            href="/forgot-password"
            className="text-[#C9A96E]/70 hover:text-[#C9A96E] text-xs transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
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
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-white/30 text-xs">ou</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full border border-white/15 hover:border-white/30 text-white/70 hover:text-white py-3 rounded-xl text-sm transition-all disabled:opacity-50"
      >
        Enviar link de acesso por email
      </button>
    </form>
  );
}
