import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import CheckinReport from "@/components/app/checkin-report";

export const metadata: Metadata = { title: "Check-in · Admin" };

export default function AdminCheckin() {
  return (
    <>
      <PageHeader title="Relatório de check-in" subtitle="Validações por evento." />
      <main style={{ padding: 32, maxWidth: 760 }}>
        <CheckinReport />
      </main>
    </>
  );
}
