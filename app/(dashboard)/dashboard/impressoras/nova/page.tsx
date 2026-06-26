import { Header } from "@/components/dashboard/header";
import { PrinterForm } from "@/components/dashboard/printer-form";
import { createPrinter } from "@/lib/actions/printers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova impressora" };

export default function NovaPrintPage() {
  return (
    <>
      <Header title="Nova Impressora" description="Cadastre uma impressora." />
      <main className="p-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <PrinterForm action={createPrinter} />
        </div>
      </main>
    </>
  );
}
