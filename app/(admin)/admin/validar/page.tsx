import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import TicketValidator from "@/components/app/ticket-validator";

export const metadata: Metadata = { title: "Validar ingresso · Admin" };

export default function AdminValidar() {
  return (
    <>
      <PageHeader title="Validar ingresso" subtitle="Check-in na entrada do evento." />
      <main style={{ padding: 32 }}>
        <TicketValidator />
      </main>
    </>
  );
}
