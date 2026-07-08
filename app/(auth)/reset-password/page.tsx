import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nova senha" };

export default function ResetPasswordPage() {
  return (
    <div className="rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-7 shadow-[4px_4px_0_var(--color-tinta)]">
      <h1 className="text-[26px] font-extrabold leading-tight text-tinta">Nova senha</h1>
      <p className="corpo-suave mb-5 mt-1">Defina uma nova senha para sua conta.</p>
      <ResetForm />
    </div>
  );
}
