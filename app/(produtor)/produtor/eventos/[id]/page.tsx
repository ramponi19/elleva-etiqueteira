import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { CriarEventoForm } from "@/components/elleva/criar-evento-form";
import CancelEventButton from "@/components/app/cancel-event-button";

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
  const { user, role } = await getAuth();
  if (!user) notFound();
  const supabase = await createClient();

  // A RLS deixa QUALQUER UM ler um evento publicado (é o que alimenta a página
  // pública), então sem esta checagem a tela de edição abria o evento de outro
  // produtor — expondo configuração que não é pública: taxa negociada, pixels de
  // rastreamento, endereço completo, dados do produtor e modelo do certificado.
  // Escrita já era barrada em updateEvent; aqui fechamos a LEITURA.
  const { data: dono } = await supabase.from("events").select("producer_id").eq("id", id).single();
  if (!dono) notFound();
  if (role !== "admin" && dono.producer_id !== user.id) notFound();

  const { data: ev } = await supabase
    .from("events")
    .select(
      "id, title, description, category, subcategory, venue, city, state, cep, address, address_number, address_complement, neighborhood, show_on_maps, starts_at, ends_at, cover_url, producer_name, producer_bio, visibility, absorb_fee, ticket_nomenclature, tracking_meta_pixel, tracking_ga, theme, has_seating, certificate_enabled, certificate_title, certificate_body, certificate_hours, certificate_signer, status, ticket_tiers(id, name, description, price, capacity, is_free, is_addon, is_half, sort_order), seats(tier_id, sector, row_label, seat_num, pos_row)"
    )
    .eq("id", id)
    .single();

  if (!ev) notFound();

  const start = split(ev.starts_at);
  const end = split(ev.ends_at);

  type TierRow = { id: string; name: string; description: string | null; price: number; capacity: number | null; is_free: boolean | null; is_addon: boolean | null; is_half: boolean | null; sort_order: number };
  const tiersSorted = ((ev.ticket_tiers ?? []) as TierRow[]).sort((a, b) => a.sort_order - b.sort_order);
  const tiers = tiersSorted.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    price: t.price != null ? String(t.price) : "",
    capacity: t.capacity ? String(t.capacity) : "",
    isFree: t.is_free ?? false,
    isAddon: t.is_addon ?? false,
    isHalf: t.is_half ?? false,
  }));

  // reconstrói os setores a partir dos assentos salvos (pro form de edição)
  type SeatRow = { tier_id: string | null; sector: string; row_label: string; seat_num: number; pos_row: number };
  const tierIndexById = new Map(tiersSorted.map((t, i) => [t.id, i]));
  const grupos = new Map<string, { rows: Set<string>; maxCol: number; tierId: string | null; minRow: number }>();
  for (const s of (ev.seats ?? []) as SeatRow[]) {
    const g = grupos.get(s.sector) ?? { rows: new Set<string>(), maxCol: 0, tierId: s.tier_id, minRow: s.pos_row };
    g.rows.add(s.row_label);
    g.maxCol = Math.max(g.maxCol, s.seat_num);
    g.minRow = Math.min(g.minRow, s.pos_row);
    if (g.tierId == null) g.tierId = s.tier_id;
    grupos.set(s.sector, g);
  }
  const sectors = [...grupos.entries()]
    .sort((a, b) => a[1].minRow - b[1].minRow)
    .map(([name, g]) => ({
      name,
      tierIndex: (g.tierId != null ? tierIndexById.get(g.tierId) : 0) ?? 0,
      rows: String(g.rows.size),
      cols: String(g.maxCol),
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
    tiers: tiers.length ? tiers : [{ name: "Inteira", description: "", price: "", capacity: "", isFree: false, isAddon: false, isHalf: false }],
    hasSeating: ev.has_seating ?? false,
    sectors,
    certificateEnabled: ev.certificate_enabled ?? false,
    certificateTitle: ev.certificate_title ?? "",
    certificateBody: ev.certificate_body ?? "",
    certificateHours: ev.certificate_hours ?? "",
    certificateSigner: ev.certificate_signer ?? "",
    absorbFee: ev.absorb_fee ?? false,
    nomenclature: ev.ticket_nomenclature ?? "Ingresso",
    producerName: ev.producer_name ?? "",
    producerBio: ev.producer_bio ?? "",
    trackingMetaPixel: ev.tracking_meta_pixel ?? "",
    trackingGa: ev.tracking_ga ?? "",
    theme: ev.theme ?? "",
    accepted: true,
    visibility: (ev.visibility ?? "public") as "public" | "private",
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-10">
      <h1 className="display-2 text-tinta">Editar evento</h1>
      <p className="corpo-suave mb-8 mt-1">{ev.title}</p>
      <CriarEventoForm eventId={id} statusAtual={ev.status as string} initial={initial} />
      <div className="mt-10">
        <CancelEventButton eventId={id} title={ev.title} status={ev.status as string} />
      </div>
    </div>
  );
}
