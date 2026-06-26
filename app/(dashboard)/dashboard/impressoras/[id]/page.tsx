import { notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { PrinterForm } from "@/components/dashboard/printer-form";
import { createClient } from "@/lib/supabase/server";
import { updatePrinter } from "@/lib/actions/printers";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("printers")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data?.name ?? "Editar impressora" };
}

export default async function EditarImpressoraPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: printer } = await supabase
    .from("printers")
    .select("*")
    .eq("id", id)
    .single();

  if (!printer) notFound();

  const action = updatePrinter.bind(null, id);

  return (
    <>
      <Header title={printer.name} description={printer.model ?? "Impressora"} />
      <main className="p-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#1A2744]/8 p-8">
          <PrinterForm action={action} printer={printer} />
        </div>
      </main>
    </>
  );
}
