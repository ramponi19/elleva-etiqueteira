import { NextResponse } from "next/server";
import { mercadoPagoProvider } from "@/lib/payments/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import { markOrderPaid } from "@/lib/orders-helpers";

// Webhook do Mercado Pago. A assinatura e a leitura do pagamento ficam no
// adaptador (lib/payments/mercadopago). Outros provedores têm sua própria rota.
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
    if (!mercadoPagoProvider.verifyWebhookSignature(request, queryDataId ?? paymentId)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    if (!paymentId) return NextResponse.json({ ignored: true });

    const payment = await mercadoPagoProvider.fetchWebhookPayment(paymentId);
    if (!payment || !payment.orderId) return NextResponse.json({ ignored: true });

    if (payment.status === "approved") {
      const svc = await createServiceClient();
      await markOrderPaid(svc, payment.orderId);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      const svc = await createServiceClient();
      await svc.from("orders").update({ status: "cancelled" }).eq("id", payment.orderId);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
