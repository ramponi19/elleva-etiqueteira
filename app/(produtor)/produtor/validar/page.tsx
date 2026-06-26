import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import TicketValidator from "@/components/app/ticket-validator";

export const metadata: Metadata = { title: "Validar ingresso · Produtor" };

export default function ProdutorValidar() {
  return (
    <>
      <PageHeader title="Validar ingresso" subtitle="Check-in dos seus eventos." />
      <main style={{ padding: 32 }}>
        <TicketValidator />
      </main>
    </>
  );
}
