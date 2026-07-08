import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { ContaPerfilForm } from "@/components/elleva/conta-perfil-form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function ContaPerfil() {
  const { user } = await getAuth();
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("profiles")
    .select(
      "full_name, cpf, birth_date, phone, cep, address, address_number, address_complement, neighborhood, city, state"
    )
    .eq("id", user!.id)
    .single();

  const initial = {
    fullName: p?.full_name ?? "",
    cpf: p?.cpf ?? "",
    birthDate: p?.birth_date ?? "",
    phone: p?.phone ?? "",
    cep: p?.cep ?? "",
    address: p?.address ?? "",
    addressNumber: p?.address_number ?? "",
    addressComplement: p?.address_complement ?? "",
    neighborhood: p?.neighborhood ?? "",
    city: p?.city ?? "",
    state: p?.state ?? "",
  };

  return <ContaPerfilForm userId={user!.id} email={user!.email ?? ""} initial={initial} />;
}
