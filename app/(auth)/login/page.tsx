import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1A2744] flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 border-r border-white/10">
        <Link href="/">
          <span
            className="text-2xl text-white"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Elleva
          </span>
        </Link>
        <blockquote className="space-y-3">
          <p
            className="text-white/80 text-xl leading-relaxed italic"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            &ldquo;Reduzimos erros de etiquetagem em 94% no primeiro mês.&rdquo;
          </p>
          <footer className="text-white/40 text-sm">
            Ricardo Almeida · Indústria Alfa
          </footer>
        </blockquote>
        <p className="text-white/20 text-xs">
          © {new Date().getFullYear()} Elleva Tecnologia
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-10">
            <span
              className="text-2xl text-white"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Elleva
            </span>
          </Link>

          <h1
            className="text-3xl text-white mb-1"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Boas-vindas de volta
          </h1>
          <p className="text-white/50 text-sm mb-8">
            Entre com sua conta para acessar o painel.
          </p>

          <LoginForm />

          <p className="mt-6 text-center text-white/40 text-sm">
            Não tem conta?{" "}
            <Link
              href="/signup"
              className="text-[#C9A96E] hover:text-[#D4B882] transition-colors"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
