import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#1A2744] flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="block mb-10">
          <span
            className="text-2xl text-white"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Elleva
          </span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#C9A96E]/15 border border-[#C9A96E]/30 rounded-full px-3 py-1 mb-4">
            <span className="text-[#C9A96E] text-xs font-medium">
              14 dias gratuito · Sem cartão de crédito
            </span>
          </div>
          <h1
            className="text-3xl text-white mb-1"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Comece gratuitamente
          </h1>
          <p className="text-white/50 text-sm">
            Crie sua conta e comece a gerenciar etiquetas em minutos.
          </p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-white/40 text-sm">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-[#C9A96E] hover:text-[#D4B882] transition-colors"
          >
            Entrar
          </Link>
        </p>

        <p className="mt-4 text-center text-white/25 text-xs">
          Ao criar uma conta você concorda com os{" "}
          <Link href="/terms" className="underline hover:text-white/40">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacy" className="underline hover:text-white/40">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
