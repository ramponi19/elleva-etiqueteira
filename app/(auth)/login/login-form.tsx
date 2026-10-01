"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { emailHasAccount } from "@/lib/actions/auth";
import { chamarAction } from "@/lib/action-client";

const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";
const label = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-tinta-60";

/** destino: para onde voltar depois de entrar (já validado pelo destinoSeguro) */
export function LoginForm({ destino = "/" }: { destino?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [semConta, setSemConta] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSemConta(false);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      // Decisão de produto: distinguir "não tem conta" de "senha errada" e
      // oferecer o cadastro. A checagem é server-side e rate-limitada por IP;
      // se não der pra saber, cai na mensagem genérica.
      const chk = await chamarAction(() => emailHasAccount(email));
      if ("ok" in chk && chk.ok === false) {
        setError(chk.error); // deploy skew / rede — não travar o botão
      } else if ("exists" in chk && !chk.exists) {
        setError("Não encontramos uma conta com esse e-mail.");
        setSemConta(true);
      } else if ("exists" in chk && chk.exists) {
        setError("Senha incorreta. Se esqueceu, use “Esqueceu?” ou o link por e-mail.");
      } else {
        setError("Email ou senha incorretos.");
      }
      setLoading(false);
      return;
    }
    router.push(destino);
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
      options: { emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(destino)}` },
    });
    setLoading(false);
    if (error) setError("Não foi possível enviar o link. Tente novamente.");
    else setInfo(`Link de acesso enviado para ${email}.`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={label} htmlFor="login-email">E-mail</label>
        <input id="login-email" name="email" autoComplete="email" className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className={label} htmlFor="login-senha">Senha</label>
          <Link href="/forgot-password" className="text-[12px] text-sol-escuro hover:underline">Esqueceu?</Link>
        </div>
        <input id="login-senha" name="password" autoComplete="current-password" className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>

      {error && (
        <div className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-3.5 py-2.5 text-[13.5px]">
          <p className="m-0 text-sol-escuro">{error}</p>
          {semConta && (
            <Link
              href={`/signup?email=${encodeURIComponent(email)}`}
              className="mt-1.5 inline-block font-semibold text-tinta underline underline-offset-2 hover:text-sol-escuro"
            >
              Deseja se cadastrar? Criar conta →
            </Link>
          )}
        </div>
      )}
      {info && <p className="rounded-[10px] border-[1.5px] border-tinta bg-papel-2 px-3.5 py-2.5 text-[13.5px] text-tinta">{info}</p>}

      <Button type="submit" variante="primario" className="mt-1 w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="my-1 flex items-center gap-3 text-[12px] text-tinta-60">
        <span className="h-px flex-1 bg-tinta/15" /> ou <span className="h-px flex-1 bg-tinta/15" />
      </div>

      <Button type="button" variante="contorno" className="w-full" onClick={handleMagicLink} disabled={loading}>
        Receber link por email
      </Button>
    </form>
  );
}
