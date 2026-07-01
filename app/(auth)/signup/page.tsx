import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/shared/logo";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function SignupPage() {
  return (
    <div className="marketing-mono auth-shell">
      <Link href="/" className="auth-brand">
        <Logo width={34} /> Elleva Tickets
      </Link>

      <div className="auth-card">
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-sub">É rápido — leva menos de um minuto.</p>

        <SignupForm />

        <p className="auth-alt">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>

        <p className="auth-terms">
          Ao criar uma conta você concorda com os{" "}
          <Link href="/terms">Termos</Link> e a <Link href="/privacy">Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
