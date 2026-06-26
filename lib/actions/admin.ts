"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type Role = "customer" | "producer" | "admin";

export async function setUserRole(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  const { role: myRole } = await getAuth();
  if (myRole !== "admin") return { ok: false, error: "Sem permissão." };

  const svc = await createServiceClient();
  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clientes");
  return { ok: true };
}

export async function createCoupon(input: {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { role } = await getAuth();
  if (role !== "admin") return { ok: false, error: "Sem permissão." };

  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um código." };
  if (!(input.discountValue > 0)) return { ok: false, error: "Valor inválido." };

  const svc = await createServiceClient();
  const { error } = await svc.from("coupons").insert({
    code,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    max_uses: input.maxUses ?? null,
  });
  if (error) {
    return { ok: false, error: error.message.includes("duplicate") ? "Cupom já existe." : error.message };
  }
  revalidatePath("/admin/cupons");
  return { ok: true };
}

export async function setCouponActive(code: string, active: boolean) {
  const { role } = await getAuth();
  if (role !== "admin") return { ok: false };
  const svc = await createServiceClient();
  await svc.from("coupons").update({ active }).eq("code", code);
  revalidatePath("/admin/cupons");
  return { ok: true };
}
