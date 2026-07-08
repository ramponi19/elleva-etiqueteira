import Link from "next/link";
import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-7 shadow-[4px_4px_0_var(--color-tinta)]">
      <h1 className="text-[26px] font-extrabold leading-tight text-tinta">Recuperar senha</h1>
      <p className="corpo-suave mb-5 mt-1">Enviamos um link para você redefinir a senha.</p>
      <ForgotForm />
      <p className="corpo-suave mt-5 text-center">
        Lembrou?{" "}
        <Link href="/login" className="font-medium text-sol-escuro underline underline-offset-2">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
