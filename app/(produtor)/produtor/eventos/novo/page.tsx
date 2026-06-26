import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import EventForm from "@/components/app/event-form";

export const metadata: Metadata = { title: "Novo evento" };

export default function NovoEvento() {
  return (
    <>
      <PageHeader title="Novo evento" subtitle="Publique um evento e defina os lotes." />
      <main style={{ padding: 32 }}>
        <EventForm />
      </main>
    </>
  );
}
