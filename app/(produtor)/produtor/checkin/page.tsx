import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { CheckinReportElleva } from "@/components/elleva/checkin-report";

export const metadata: Metadata = { title: "Check-in · Produtor" };

export default async function ProdutorCheckin() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo
  // (docs do Next: "A layout also does not control whether the rest of the
  // route renders"), então a guarda tem que estar aqui também.
  await requireAuth();
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Relatório de check-in</h1>
      <p className="corpo-suave mb-6 mt-1">Validações dos seus eventos.</p>
      <div className="max-w-[760px]">
        <CheckinReportElleva />
      </div>
    </div>
  );
}
