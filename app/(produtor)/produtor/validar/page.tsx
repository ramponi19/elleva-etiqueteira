import type { Metadata } from "next";
import { TicketValidatorElleva } from "@/components/elleva/ticket-validator";

export const metadata: Metadata = { title: "Validar ingresso · Produtor" };

export default function ProdutorValidar() {
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Validar ingresso</h1>
      <p className="corpo-suave mb-6 mt-1">Faça o check-in dos seus eventos na entrada.</p>
      <TicketValidatorElleva />
    </div>
  );
}
