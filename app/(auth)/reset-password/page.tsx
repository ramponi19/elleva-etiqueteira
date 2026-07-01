import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/shared/logo";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Nova senha",
};

export default function ResetPasswordPage() {
  return (
    <div className="marketing-mono auth-shell">
      <Link href="/" className="auth-brand">
        <Logo width={34} /> Elleva Tickets
      </Link>

      <div className="auth-card">
        <h1 className="auth-title">Nova senha</h1>
        <p className="auth-sub">Defina uma nova senha para sua conta.</p>

        <ResetForm />
      </div>
    </div>
  );
}
