import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CriarEventoForm } from "@/components/elleva/criar-evento-form";

export const metadata: Metadata = { title: "Editar evento" };

function split(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export default async function EditarEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ev } = await supabase
    .from("events")
    .select(
      "id, title, description, category, subcategory, venue, city, state, cep, address, address_number, address_complement, neighborhood, show_on_maps, starts_at, ends_at, cover_url, producer_name, producer_bio, visibility, absorb_fee, ticket_nomenclature, status, ticket_tiers(name, description, price, capacity, is_free, sort_order)"
    )
    .eq("id", id)
    .single();

  if (!ev) notFound();

  const start = split(ev.starts_at);
  const end = split(ev.ends_at);

  type TierRow = { name: string; description: string | null; price: number; capacity: number | null; is_free: boolean | null; sort_order: number };
  const tiers = ((ev.ticket_tiers ?? []) as TierRow[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({
      name: t.name,
      description: t.description ?? "",
      price: t.price != null ? String(t.price) : "",
      capacity: t.capacity ? String(t.capacity) : "",
      isFree: t.is_free ?? false,
    }));

  const initial = {
    title: ev.title,
    coverUrl: ev.cover_url ?? "",
    category: ev.category,
    subcategory: ev.subcategory ?? "",
    date: start.date,
    time: start.time,
    endDate: end.date,
    endTime: end.time,
    description: ev.description ?? "",
    venue: ev.venue,
    cep: ev.cep ?? "",
    address: ev.address ?? "",
    addressNumber: ev.address_number ?? "",
    addressComplement: ev.address_complement ?? "",
    neighborhood: ev.neighborhood ?? "",
    city: ev.city,
    state: ev.state ?? "",
    showOnMaps: ev.show_on_maps ?? true,
    tiers: tiers.length ? tiers : [{ name: "Inteira", description: "", price: "", capacity: "", isFree: false }],
    absorbFee: ev.absorb_fee ?? false,
    nomenclature: ev.ticket_nomenclature ?? "Ingresso",
    producerName: ev.producer_name ?? "",
    producerBio: ev.producer_bio ?? "",
    accepted: true,
    visibility: (ev.visibility ?? "public") as "public" | "private",
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-10">
      <h1 className="display-2 text-tinta">Editar evento</h1>
      <p className="corpo-suave mb-8 mt-1">{ev.title}</p>
      <CriarEventoForm eventId={id} initial={initial} />
    </div>
  );
}
