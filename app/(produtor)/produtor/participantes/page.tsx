import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { EmBreve } from "@/components/elleva/em-breve";
import { ParticipantesList, type Participante } from "@/components/elleva/participantes-list";

export const metadata: Metadata = { title: "Participantes · Produtor" };

type Row = {
  code: string;
  status: string;
  event_id: string | null;
  event_title: string;
  tier_name: string;
  used_at: string | null;
  checked_in_by: string | null;
  orders: { buyer_name: string; buyer_email: string; buyer_whatsapp: string | null } | { buyer_name: string; buyer_email: string; buyer_whatsapp: string | null }[] | null;
};
const buyer = (r: Row) => (Array.isArray(r.orders) ? r.orders[0] : r.orders);

export default async function ProdutorParticipantes() {
  const { user, role } = await getAuth();
  const supabase = await createClient();

  let evq = supabase.from("events").select("id, title").order("starts_at", { ascending: false });
  if (role === "producer") evq = evq.eq("producer_id", user!.id);
  const { data: events } = await evq;
  const eventos = events ?? [];
  const ids = eventos.map((e) => e.id);

  let rows: Row[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("tickets")
      .select("code, status, event_id, event_title, tier_name, used_at, checked_in_by, orders(buyer_name, buyer_email, buyer_whatsapp)")
      .in("event_id", ids)
      .order("created_at", { ascending: false });
    rows = (data ?? []) as unknown as Row[];
  }

  const participantes: Participante[] = rows.map((r) => {
    const b = buyer(r);
    return {
      code: r.code,
      status: r.status,
      eventId: r.event_id ?? "",
      eventTitle: r.event_title,
      tierName: r.tier_name,
      usedAt: r.used_at,
      validadoPor: r.checked_in_by ?? "",
      buyerName: b?.buyer_name ?? "",
      buyerEmail: b?.buyer_email ?? "",
      buyerWhatsapp: b?.buyer_whatsapp ?? "",
    };
  });

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Participantes</h1>
      <p className="corpo-suave mb-6 mt-1">Quem tem ingresso dos seus eventos, com status de check-in.</p>
      {!participantes.length ? (
        <EmBreve icon="lucide:users" nota="Nenhum ingresso emitido ainda. Os participantes aparecem aqui após as vendas." />
      ) : (
        <ParticipantesList participantes={participantes} eventos={eventos} />
      )}
    </div>
  );
}
