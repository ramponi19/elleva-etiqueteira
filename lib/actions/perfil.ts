"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export interface DadosCompraInput {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const s = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Salva os "dados de compra" do perfil do usuário logado (usado pelo modal
 *  "Complete seu cadastro" pós-criação de conta e pela tela de perfil). */
export async function salvarDadosCompra(
  input: DadosCompraInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await getAuth();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const cpf = s(input.cpf, 20);
  if (cpf && !isValidCPF(cpf)) return { ok: false, error: "Esse CPF não bateu. Confere os números?" };
  const birth = s(input.birthDate, 10);
  if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { ok: false, error: "Data de nascimento inválida." };
  const uf = s(input.state, 2).toUpperCase();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: s(input.fullName) || null,
      cpf: cpf || null,
      birth_date: birth || null,
      phone: s(input.phone, 20) || null,
      cep: onlyDigits(s(input.cep, 10)) ? s(input.cep, 10) : null,
      address: s(input.address) || null,
      address_number: s(input.addressNumber, 20) || null,
      address_complement: s(input.addressComplement, 80) || null,
      neighborhood: s(input.neighborhood, 80) || null,
      city: s(input.city, 80) || null,
      state: uf || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/conta/perfil");
  return { ok: true };
}
