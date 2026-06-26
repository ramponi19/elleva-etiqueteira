import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import CheckinReport from "@/components/app/checkin-report";

export const metadata: Metadata = { title: "Check-in · Produtor" };

export default function ProdutorCheckin() {
  return (
    <>
      <PageHeader title="Relatório de check-in" subtitle="Validações dos seus eventos." />
      <main style={{ padding: 32, maxWidth: 760 }}>
        <CheckinReport />
      </main>
    </>
  );
}
