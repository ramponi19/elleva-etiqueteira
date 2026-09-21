import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { CheckinReportElleva } from "@/components/elleva/checkin-report";

export const metadata: Metadata = { title: "Check-in · Admin" };

export default async function AdminCheckin() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Relatório de check-in</h1>
      <p className="corpo-suave mb-6 mt-1">Validações por evento.</p>
      <div className="max-w-[760px]">
        <CheckinReportElleva />
      </div>
    </div>
  );
}
