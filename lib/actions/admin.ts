"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { reverseSold, cancelTickets, sendRefundEmail, releaseCouponForOrder } from "@/lib/orders-helpers";
import { audit } from "@/lib/audit";

export type Role = "user" | "admin";

export async function setUserRole(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  const { role: myRole } = await getAuth();
  if (myRole !== "admin") return { ok: false, error: "Sem permissão." };

  const svc = await createServiceClient();
  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await audit("set_role", userId, { role });
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
  // sem esse teto, digitar "500" em vez de "50" criava um cupom que zera o
  // subtotal (o ingresso saía de graça e a taxa continuava sendo cobrada)
  if (input.discountType === "percent" && input.discountValue > 100)
    return { ok: false, error: "Desconto percentual não pode passar de 100%." };

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
    // tenta reembolsar no provedor que processou o pedido
    const provider = await getPaymentProvider();
    if (order.payment_id && order.payment_provider === provider.id) {
      try {
        await provider.refund(order.payment_id);
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Falha ao reembolsar no provedor de pagamento." };
      }
    }
    await svc.from("orders").update({ status: "refunded" }).eq("id", orderId);
    await releaseCouponForOrder(svc, orderId); // A-1
    await cancelTickets(svc, orderId);
    await reverseSold(svc, orderId);
    await sendRefundEmail(svc, orderId);
    await audit("order_refunded", orderId, {});
  } else {
    await svc.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    await releaseCouponForOrder(svc, orderId); // A-1
    await audit("order_cancelled", orderId, {});
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true };
}

/** Taxa de serviço (%) de um evento — negociada pela Elleva com o produtor. */
export async function setEventFeePct(
  eventId: string,
  pct: number
): Promise<{ ok: boolean; error?: string }> {
  const { role } = await getAuth();
  if (role !== "admin") return { ok: false, error: "Sem permissão." };
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    return { ok: false, error: "Percentual inválido (0–100)." };
  }

  const svc = await createServiceClient();
  const { error } = await svc
    .from("events")
    .update({ service_fee_pct: pct })
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/eventos");
  return { ok: true };
}

export async function setEventMaxInstallments(
  eventId: string,
  n: number
): Promise<{ ok: boolean; error?: string }> {
  const { role } = await getAuth();
  if (role !== "admin") return { ok: false, error: "Sem permissão." };
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    return { ok: false, error: "Parcelas inválidas (1–12)." };
  }

  const svc = await createServiceClient();
  const { error } = await svc
    .from("events")
    .update({ max_installments: n })
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/eventos");
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
