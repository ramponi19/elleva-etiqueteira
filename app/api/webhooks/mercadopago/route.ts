import { NextResponse } from "next/server";
import { getMpPayment } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import { markOrderPaid } from "@/lib/orders-helpers";

// Mercado Pago notifica via POST (e às vezes via querystring topic/id).
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;
    const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (!paymentId) {
      const body = await request.json().catch(() => null);
      if (body?.type && body.type !== "payment") {
        return NextResponse.json({ ignored: true });
      }
      paymentId = body?.data?.id ? String(body.data.id) : null;
    } else if (topic && topic !== "payment") {
      return NextResponse.json({ ignored: true });
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
