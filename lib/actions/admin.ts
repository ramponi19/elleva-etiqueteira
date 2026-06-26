"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getMpRefund } from "@/lib/mercadopago";
import { reverseSold, cancelTickets } from "@/lib/orders-helpers";

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

/** Cancela (pending) ou reembolsa (paid) um pedido — admin. */
export async function cancelOrder(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const { role } = await getAuth();
  if (role !== "admin") return { ok: false, error: "Sem permissão." };

  const svc = await createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("status, payment_id, payment_provider")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  if (order.status === "refunded" || order.status === "cancelled") {
    return { ok: false, error: "Pedido já cancelado." };
  }

  if (order.status === "paid") {
    // tenta reembolsar no Mercado Pago
    if (order.payment_provider === "mercadopago" && order.payment_id) {
      const refund = getMpRefund();
      if (refund) {
        try {
          await refund.create({ payment_id: order.payment_id });
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Falha ao reembolsar no Mercado Pago." };
        }
      }
    }
    await svc.from("orders").update({ status: "refunded" }).eq("id", orderId);
    await cancelTickets(svc, orderId);
    await reverseSold(svc, orderId);
  } else {
    await svc.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
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
