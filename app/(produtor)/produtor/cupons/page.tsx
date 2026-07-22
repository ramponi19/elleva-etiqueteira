import type { Metadata } from "next";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { EmBreve } from "@/components/elleva/em-breve";
import { CuponsProdutor, type CupomView } from "@/components/elleva/cupons-produtor";

export const metadata: Metadata = { title: "Cupons · Produtor" };

export default async function ProdutorCupons() {
  const { user, role } = await getAuth();
  const supabase = await createClient();

  let evq = supabase.from("events").select("id, title").order("starts_at", { ascending: false });
  if (role === "producer") evq = evq.eq("producer_id", user!.id);
  const { data: events } = await evq;
  const eventos = events ?? [];
  const titleById = new Map(eventos.map((e) => [e.id, e.title]));

  // cupons do produtor via service client, escopados por producer_id
  const svc = await createServiceClient();
  let cq = svc
    .from("coupons")
    .select("code, discount_type, discount_value, max_uses, used_count, active, event_id")
    .order("created_at", { ascending: false });
  if (role === "producer") cq = cq.eq("producer_id", user!.id);
  else cq = cq.not("event_id", "is", null); // admin vê os de evento
  const { data: cData } = await cq;

  const cupons: CupomView[] = (cData ?? []).map((c) => ({
    code: c.code,
    discount_type: c.discount_type,
    discount_value: Number(c.discount_value),
    max_uses: c.max_uses,
    used_count: c.used_count ?? 0,
    active: c.active,
    event_id: c.event_id,
    eventTitle: (c.event_id && titleById.get(c.event_id)) || "Evento",
  }));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Cupons</h1>
      <p className="corpo-suave mb-6 mt-1">Crie cupons de desconto para os seus eventos.</p>
      {!eventos.length ? (
        <EmBreve icon="lucide:ticket-percent" nota="Crie um evento primeiro pra poder oferecer cupons." />
      ) : (
        <CuponsProdutor eventos={eventos} cupons={cupons} />
      )}
    </div>
  );
}
