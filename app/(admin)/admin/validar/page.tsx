import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { TicketValidatorElleva } from "@/components/elleva/ticket-validator";

export const metadata: Metadata = { title: "Validar ingresso · Admin" };

export default async function AdminValidar() {
  // Layout NÃO protege página: no App Router as duas renderizam em paralelo,
  // então o redirect do layout não impede esta consulta de rodar (docs do Next:
  // "A layout also does not control whether the rest of the route renders").
  await requireRole(["admin"]);
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Validar ingresso</h1>
      <p className="corpo-suave mb-6 mt-1">Check-in na entrada — qualquer evento da plataforma.</p>
      <TicketValidatorElleva />
    </div>
  );
}
