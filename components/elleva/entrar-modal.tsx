"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/marketing/auth-modal";

/** "Entrar" que abre o modal de login/cadastro NA PRÓPRIA PÁGINA (em vez de
 *  navegar pro /login). Ao logar, recarrega a página já autenticada.
 *  `className` recebe o estilo do link do nav onde ele substitui o <Link>. */
export function EntrarModal({
  className,
  children = "Entrar",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "inherit" }}
      >
        {children}
      </button>
      {open && (
        <AuthModal
          contexto="geral"
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
