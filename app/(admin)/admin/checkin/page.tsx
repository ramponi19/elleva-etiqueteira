import type { Metadata } from "next";
import { CheckinReportElleva } from "@/components/elleva/checkin-report";

export const metadata: Metadata = { title: "Check-in · Admin" };

export default function AdminCheckin() {
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
