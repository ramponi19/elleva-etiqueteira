"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { allowHit, isAllowed, clientIp } from "@/lib/rate-limit";

export interface GateOperator {
  id: string;
  name: string;
  doc: string;
  pin: string;
  active: boolean;
}

async function authorize() {
  // Qualquer conta logada gere a portaria dos próprios eventos; a posse por
  // producer_id protege as tabelas (gate_operators.producer_id = auth.uid()).
  const { user } = await getAuth();
  if (!user) return null;
  return user;
}

/** PIN aleatório de 6 dígitos (M-5). Antes eram os 4 primeiros dígitos do CPF:
 *  previsível pra quem conhece o CPF e só 10 mil combinações. Agora 1 milhão,
 *  gerado com CSPRNG; somado ao freio `pinfail` (10 falhas / 5 min / IP), varrer
 *  fica impraticável. */
const gerarPin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
const PIN_TENTATIVAS = 5; // colisão (producer_id, pin) é rara; retenta com outro PIN

/** Cadastra um operador de portaria e devolve o PIN gerado. */
export async function createGateOperator(
  name: string,
  doc: string
): Promise<{ ok: true; pin: string } | { ok: false; error: string }> {
  const user = await authorize();
  if (!user) return { ok: false, error: "Sem permissão." };
  if (!name.trim()) return { ok: false, error: "Informe o nome do operador." };
  if (!isValidCPF(doc)) return { ok: false, error: "Esse CPF não bateu. Confere os números?" };

  const digits = onlyDigits(doc);
  const supabase = await createClient();
  let ultimoErro = "Não foi possível gerar o PIN. Tente de novo.";
  for (let i = 0; i < PIN_TENTATIVAS; i++) {
    const pin = gerarPin();
    const { error } = await supabase
      .from("gate_operators")
      .insert({ producer_id: user.id, name: name.trim(), doc: digits, pin, active: true });
    if (!error) {
      revalidatePath("/produtor/validar");
      return { ok: true, pin };
    }
    if (!/duplicate|unique/i.test(error.message)) return { ok: false, error: error.message };
    ultimoErro = "Não foi possível gerar um PIN único. Tente de novo.";
  }
  return { ok: false, error: ultimoErro };
}

/** Gera um PIN novo pro operador (ex.: PIN vazou ou foi compartilhado). O antigo
 *  para de valer na hora; quem estiver logado na portaria com ele cai pra tela de PIN. */
export async function regenerateGateOperatorPin(
  id: string
): Promise<{ ok: true; pin: string } | { ok: false; error: string }> {
  const user = await authorize();
  if (!user) return { ok: false, error: "Sem permissão." };
  const supabase = await createClient();
  for (let i = 0; i < PIN_TENTATIVAS; i++) {
    const pin = gerarPin();
    // RLS garante que só o dono altera; .select() confirma que a linha existe.
    const { data, error } = await supabase.from("gate_operators").update({ pin }).eq("id", id).select("id");
    if (error) {
      if (/duplicate|unique/i.test(error.message)) continue;
      return { ok: false, error: error.message };
    }
    if (!data || data.length === 0) return { ok: false, error: "Operador não encontrado." };
    revalidatePath("/produtor/validar");
    return { ok: true, pin };
  }
  return { ok: false, error: "Não foi possível gerar um PIN único. Tente de novo." };
}

export async function setGateOperatorActive(id: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  const user = await authorize();
  if (!user) return { ok: false, error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("gate_operators").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/produtor/validar");
  return { ok: true };
}

export async function deleteGateOperator(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await authorize();
  if (!user) return { ok: false, error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("gate_operators").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/produtor/validar");
  return { ok: true };
}

/** A portaria deste evento exige PIN? (produtor tem operador ativo cadastrado) */
export async function gateRequiresPin(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const svc = await createServiceClient();
    const { data: ev } = await svc.from("events").select("producer_id").eq("checkin_token", token).single();
    if (!ev?.producer_id) return false;
    const { count } = await svc
      .from("gate_operators")
      .select("*", { count: "exact", head: true })
      .eq("producer_id", ev.producer_id)
      .eq("active", true);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Resolve o operador pelo PIN (portaria). Devolve SÓ o nome — o CPF nunca sai
 *  do servidor (devolver o documento permitiria, num PIN adivinhado, extrair
 *  nome+CPF da equipe). O CPF é resolvido de novo no servidor, pelo PIN, na hora
 *  de gravar a auditoria do check-in. */
export async function resolveGateOperator(
  token: string,
  pin: string
): Promise<{ name: string } | null> {
  const clean = (pin || "").trim();
  if (!token || !/^\d{6}$/.test(clean)) return null;
  try {
    const svc = await createServiceClient();
    const { data: ev } = await svc.from("events").select("id, producer_id").eq("checkin_token", token).single();
    if (!ev?.producer_id) return null;
    // A7 + M4: mesmo freio de brute-force do PIN da validação (só falhas contam).
    const ip = await clientIp();
    const pinBucket = `pinfail:${ev.id}:${ip}`;
    if (!(await isAllowed(pinBucket, 10, 300))) return null;
    const { data: op } = await svc
      .from("gate_operators")
      .select("name")
      .eq("producer_id", ev.producer_id)
      .eq("pin", clean)
      .eq("active", true)
      .maybeSingle();
    if (!op) {
      await allowHit(pinBucket, 10, 300);
      return null;
    }
    return { name: op.name as string };
  } catch {
    return null;
  }
}
