"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { setCouponActive } from "@/lib/actions/admin";

/** Liga/desliga um cupom global. Antes o estado era só um Badge estático e a
 *  action `setCouponActive` existia sem nenhum botão chamando (código morto):
 *  o admin não tinha como desativar um cupom. */
export function CouponToggle({ code, active }: { code: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title={active ? "Desativar cupom" : "Ativar cupom"}
      onClick={() =>
        start(async () => {
          await setCouponActive(code, !active);
          router.refresh();
        })
      }
      className="inline-flex min-h-[38px] items-center rounded-full disabled:opacity-50"
    >
      <Badge tom={active ? "sol" : "papel"}>{pending ? "..." : active ? "Ativo" : "Inativo"}</Badge>
    </button>
  );
}
