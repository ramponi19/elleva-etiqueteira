import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-7 shadow-[4px_4px_0_var(--color-tinta)]">
      <h1 className="text-[26px] font-extrabold leading-tight text-tinta">Criar conta</h1>
      <p className="corpo-suave mb-5 mt-1">É rápido — leva menos de um minuto.</p>
      <SignupForm />
      <p className="corpo-suave mt-5 text-center">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-sol-escuro underline underline-offset-2">
          Entrar
        </Link>
      </p>
      <p className="corpo-suave mt-3 text-center text-[12.5px] text-tinta-45">
        Ao criar uma conta você concorda com os{" "}
        <Link href="/terms" className="underline underline-offset-2">Termos</Link> e a{" "}
        <Link href="/privacy" className="underline underline-offset-2">Privacidade</Link>.
      </p>
    </div>
  );
}
