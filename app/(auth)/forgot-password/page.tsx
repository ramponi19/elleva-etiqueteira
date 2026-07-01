import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/shared/logo";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return (
    <div className="marketing-mono auth-shell">
      <Link href="/" className="auth-brand">
        <Logo width={34} /> Elleva Tickets
      </Link>

      <div className="auth-card">
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-sub">Enviamos um link para você redefinir a senha.</p>

        <ForgotForm />

        <p className="auth-alt">
          Lembrou? <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
