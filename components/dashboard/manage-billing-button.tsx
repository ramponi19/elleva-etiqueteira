"use client";

import { useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { createPortalSession } from "@/lib/actions/billing";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => createPortalSession())}
      disabled={isPending}
      className="inline-flex items-center gap-2 border border-[#1A2744]/15 hover:border-[#1A2744]/30 text-[#1A2744] text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
    >
      {isPending ? "Abrindo..." : "Gerenciar cobrança"}
      <ExternalLink size={14} />
    </button>
  );
}
