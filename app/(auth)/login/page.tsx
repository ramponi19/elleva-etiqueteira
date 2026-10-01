import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { destinoSeguro } from "@/lib/destino";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-7 shadow-[4px_4px_0_var(--color-tinta)]">
      <h1 className="text-[26px] font-extrabold leading-tight text-tinta">Entrar</h1>
      <p className="corpo-suave mb-5 mt-1">Acesse sua conta para continuar.</p>
      <LoginForm destino={destinoSeguro(next)} />
      <p className="corpo-suave mt-5 text-center">
        Não tem conta?{" "}
        <Link href="/signup" className="font-medium text-sol-escuro underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
