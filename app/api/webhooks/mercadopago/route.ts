import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getMpPayment } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import { markOrderPaid } from "@/lib/orders-helpers";

/**
 * Valida a assinatura x-signature do Mercado Pago.
 * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;  → HMAC-SHA256(secret)
 * Retorna true se válido OU se não houver secret configurado (modo dev).
 */
function verifySignature(request: Request, dataId: string | null): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret → não bloqueia (dev/teste)

  const sigHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!sigHeader || !dataId) return false;

  // x-signature: "ts=1700000000,v1=abcdef..."
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryDataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
    const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

    let paymentId = queryDataId;
    if (!paymentId) {
      const body = await request.clone().json().catch(() => null);
      if (body?.type && body.type !== "payment") {
        return NextResponse.json({ ignored: true });
      }
      paymentId = body?.data?.id ? String(body.data.id) : null;
    } else if (topic && topic !== "payment") {
      return NextResponse.json({ ignored: true });
    }

    // Verificação de assinatura (assina sobre o data.id da query)
    if (!verifySignature(request, queryDataId ?? paymentId)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    if (!paymentId) return NextResponse.json({ ignored: true });

    const mp = getMpPayment();
    if (!mp) return NextResponse.json({ ignored: true });

    const payment = await mp.get({ id: paymentId });
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ignored: true });

    if (payment.status === "approved") {
      const svc = await createServiceClient();
      await markOrderPaid(svc, orderId);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      const svc = await createServiceClient();
      await svc.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
