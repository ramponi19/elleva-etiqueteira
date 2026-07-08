"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[15px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60";

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
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/callback` },
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
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tinta text-papel">
          <Icon icon="solar:letter-bold" style={{ fontSize: 24 }} />
        </span>
        <h2 className="mt-4 text-[20px] font-extrabold text-tinta">Confirme seu email</h2>
        <p className="corpo-suave mt-1">
          Enviamos um link de confirmação para <strong className="text-tinta">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={label}>Nome completo</label>
        <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required />
      </div>
      <div>
        <label className={label}>E-mail</label>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>
      <div>
        <label className={label}>Senha</label>
        <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
      </div>

      {error && <p className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px] text-sol-escuro">{error}</p>}

      <Button type="submit" variante="primario" className="mt-1 w-full" disabled={loading}>
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
