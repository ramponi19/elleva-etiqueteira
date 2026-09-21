import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { createServiceClient } from "@/lib/supabase/server";
import { markOrderPaid, markOrderRefunded, releaseSeats, releaseCouponForOrder } from "@/lib/orders-helpers";

// Webhook do Mercado Pago. A assinatura e a leitura do pagamento ficam no
// adaptador (lib/payments/mercadopago), que recebe o segredo da conta ATIVA
// (/admin/pagamentos) — trocar de conta troca a chave que valida a assinatura
// sem redeploy. Outros provedores têm sua própria rota.
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

    const provider = await getPaymentProvider();

    // Verificação de assinatura (assina sobre o data.id da query)
    if (!provider.verifyWebhookSignature(request, queryDataId ?? paymentId)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    if (!paymentId) return NextResponse.json({ ignored: true });

    const payment = await provider.fetchWebhookPayment(paymentId);
    if (!payment || !payment.orderId) return NextResponse.json({ ignored: true });

    if (payment.status === "approved") {
      const svc = await createServiceClient();
      await markOrderPaid(svc, payment.orderId);
    } else if (payment.status === "refunded") {
      // A2: estorno/chargeback no gateway — reverte o pedido pago (idempotente).
      const svc = await createServiceClient();
      await markOrderRefunded(svc, payment.orderId);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      // A3: só cancela quem AINDA está pendente. Sem esta guarda, uma notificação
      // fora de ordem (o Pix expira e o pagamento cai logo depois; ou um
      // 'rejected' que chega após o 'approved') derrubava um pedido JÁ PAGO —
      // comprador com ingresso válido e produtor perdendo a venda do extrato.
      const svc = await createServiceClient();
      const { data: done } = await svc
        .from("orders").update({ status: "cancelled" }).eq("id", payment.orderId).eq("status", "pending").select("id");
      if (done?.length) {
        // só libera se ESTE webhook flipou pending->cancelled (evita double-release)
        await releaseSeats(svc, payment.orderId);
        await releaseCouponForOrder(svc, payment.orderId); // A-1
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
