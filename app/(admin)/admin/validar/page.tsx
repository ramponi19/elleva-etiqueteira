import type { Metadata } from "next";
import { TicketValidatorElleva } from "@/components/elleva/ticket-validator";

export const metadata: Metadata = { title: "Validar ingresso · Admin" };

export default function AdminValidar() {
  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Validar ingresso</h1>
      <p className="corpo-suave mb-6 mt-1">Check-in na entrada — qualquer evento da plataforma.</p>
      <TicketValidatorElleva />
    </div>
  );
}
