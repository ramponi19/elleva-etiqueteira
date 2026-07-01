import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/shared/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="marketing-mono auth-shell">
      <Link href="/" className="auth-brand">
        <Logo width={34} /> Elleva Tickets
      </Link>

      <div className="auth-card">
        <h1 className="auth-title">Entrar</h1>
        <p className="auth-sub">Acesse sua conta para continuar.</p>

        <LoginForm />

        <p className="auth-alt">
          Não tem conta? <Link href="/signup">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
