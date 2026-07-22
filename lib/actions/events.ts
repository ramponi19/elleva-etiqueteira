"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const optStr = z.string().optional().or(z.literal("").transform(() => undefined));

const TierSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  isFree: z.coerce.boolean().optional(),
  isAddon: z.coerce.boolean().optional(),
});

// Um setor do mapa de assentos: grade rows×cols ligada a um lote (por índice).
const SectorSchema = z.object({
  name: z.string().optional(),
  tierIndex: z.coerce.number().int().nonnegative(),
  rows: z.coerce.number().int().positive().max(60),
  cols: z.coerce.number().int().positive().max(80),
});

const EventSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  category: z.enum(["SHOW", "FESTA", "ESPORTE", "TEATRO", "CORPORATIVO", "CURSO"]),
  subcategory: optStr,
  venue: z.string().min(1, "Local obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Horário obrigatório"),
  // Novos campos (opcionais no servidor; o formulário novo cobriga os do Sympla)
  endDate: optStr,
  endTime: optStr,
  cep: optStr,
  address: optStr,
  addressNumber: optStr,
  addressComplement: optStr,
  neighborhood: optStr,
  state: optStr,
  showOnMaps: z.coerce.boolean().optional(),
  producerName: optStr,
  producerBio: optStr,
  visibility: z.enum(["public", "private"]).default("public"),
  absorbFee: z.coerce.boolean().optional(),
  nomenclature: optStr,
  trackingMetaPixel: optStr,
  trackingGa: optStr,
  theme: optStr,
  hasSeating: z.coerce.boolean().optional(),
  sectors: z.array(SectorSchema).optional(),
  icon: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["draft", "published"]).default("published"),
  tiers: z.array(TierSchema).min(1, "Adicione ao menos um lote"),
});

export type EventFormState = { ok: boolean; error?: string; slug?: string };

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type EventInput = z.input<typeof EventSchema>;
type EventData = z.output<typeof EventSchema>;

/** Colunas da tabela events a partir dos dados validados (sem slug/producer_id). */
function eventColumns(v: EventData) {
  const starts_at = `${v.date}T${v.time}:00-03:00`;
  const ends_at =
    v.endDate && v.endTime ? `${v.endDate}T${v.endTime}:00-03:00` : null;
  return {
    title: v.title,
    description: v.description || null,
    category: v.category,
    subcategory: v.subcategory ?? null,
    venue: v.venue,
    city: v.city,
    state: v.state ?? null,
    cep: v.cep ?? null,
    address: v.address ?? null,
    address_number: v.addressNumber ?? null,
    address_complement: v.addressComplement ?? null,
    neighborhood: v.neighborhood ?? null,
    show_on_maps: v.showOnMaps ?? true,
    starts_at,
    ends_at,
    icon: v.icon || "solar:ticket-bold-duotone",
    cover_url: v.coverUrl ?? null,
    producer_name: v.producerName ?? null,
    producer_bio: v.producerBio ?? null,
    visibility: v.visibility,
    absorb_fee: v.absorbFee ?? false,
    ticket_nomenclature: v.nomenclature || "Ingresso",
    tracking_meta_pixel: v.trackingMetaPixel ?? null,
    tracking_ga: v.trackingGa ?? null,
    theme: v.theme || null,
    has_seating: v.hasSeating ?? false,
    status: v.status,
  };
}

/** Rótulo de fileira: 0→A, 25→Z, 26→AA… */
function rowName(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Gera as linhas de `seats` a partir dos setores (grade rows×cols por setor). */
function seatRows(
  eventId: string,
  sectors: NonNullable<EventData["sectors"]>,
  tierIds: (string | null)[]
) {
  const rows: {
    event_id: string; tier_id: string | null; sector: string;
    row_label: string; seat_num: number; label: string;
    pos_row: number; pos_col: number; status: string;
  }[] = [];
  let base = 0;
  sectors.forEach((sec, si) => {
    const sectorName = (sec.name?.trim() || (sectors.length > 1 ? `Setor ${si + 1}` : ""));
    const prefix = sectorName ? `${sectorName} ` : "";
    const tierId = tierIds[sec.tierIndex] ?? null;
    for (let r = 0; r < sec.rows; r++) {
      const rl = rowName(r);
      for (let c = 0; c < sec.cols; c++) {
        const num = c + 1;
        rows.push({
          event_id: eventId, tier_id: tierId, sector: sectorName,
          row_label: rl, seat_num: num, label: `${prefix}${rl}${num}`,
          pos_row: base + r, pos_col: c, status: "available",
        });
      }
    }
    base += sec.rows + 1;
  });
  return rows;
}

/** tierIds indexados por sort_order (== índice original do lote). */
function tierIdsByOrder(tierData: { id: string; sort_order: number }[]): string[] {
  const arr: string[] = [];
  for (const t of tierData) arr[t.sort_order] = t.id;
  return arr;
}

/** Linhas de ticket_tiers (lotes) para insert. Gratuito força preço 0. */
function tierRows(eventId: string, tiers: EventData["tiers"]) {
  return tiers.map((t, i) => ({
    event_id: eventId,
    name: t.name,
    description: t.description || null,
    price: t.isFree ? 0 : t.price,
    capacity: t.capacity ?? null,
    is_free: t.isFree ?? false,
    is_addon: t.isAddon ?? false,
    sort_order: i,
  }));
}

async function authorize() {
  const { user, role } = await getAuth();
  if (!user || (role !== "producer" && role !== "admin")) return null;
  return { user, role };
}

export async function createEvent(input: EventInput): Promise<EventFormState> {
  const auth = await authorize();
  if (!auth) return { ok: false, error: "Sem permissão." };

  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const v = parsed.data;

  const supabase = await createClient();
  let slug = slugify(v.title);

  // garante slug único
  const { data: exists } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
  if (exists) slug = `${slug}-${Math.floor(Date.now() % 100000)}`;

  const { data: ev, error } = await supabase
    .from("events")
    .insert({ slug, ...eventColumns(v), producer_id: auth.user.id })
    .select("id, slug")
    .single();

  if (error || !ev) return { ok: false, error: error?.message ?? "Falha ao criar evento" };

  const { data: tierData, error: tErr } = await supabase
    .from("ticket_tiers")
    .insert(tierRows(ev.id, v.tiers))
    .select("id, sort_order");
  if (tErr) return { ok: false, error: tErr.message };

  // assentos marcados (opt-in): gera o mapa a partir dos setores
  if (v.hasSeating && v.sectors?.length) {
    const seats = seatRows(ev.id, v.sectors, tierIdsByOrder(tierData ?? []));
    if (seats.length) {
      const { error: sErr } = await supabase.from("seats").insert(seats);
      if (sErr) return { ok: false, error: `Evento criado, mas falhou o mapa de assentos: ${sErr.message}` };
    }
  }

  revalidatePath("/produtor/eventos");
  revalidatePath("/agenda");
  return { ok: true, slug: ev.slug };
}

export async function updateEvent(id: string, input: EventInput): Promise<EventFormState> {
  const auth = await authorize();
  if (!auth) return { ok: false, error: "Sem permissão." };

  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const v = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.from("events").update(eventColumns(v)).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Se já há assentos vendidos/reservados, não mexe em lotes/mapa (evita
  // corromper pedidos existentes — deletar lotes anularia seats.tier_id).
  const { count: usados } = await supabase
    .from("seats")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id)
    .in("status", ["sold", "held"]);
  if ((usados ?? 0) > 0) {
    revalidatePath("/produtor/eventos");
    revalidatePath("/agenda");
    return { ok: true };
  }

  // substitui os lotes (simples para MVP)
  await supabase.from("ticket_tiers").delete().eq("event_id", id);
  const { data: tierData, error: tErr } = await supabase
    .from("ticket_tiers")
    .insert(tierRows(id, v.tiers))
    .select("id, sort_order");
  if (tErr) return { ok: false, error: tErr.message };

  // regenera o mapa de assentos (nenhum vendido ainda)
  await supabase.from("seats").delete().eq("event_id", id);
  if (v.hasSeating && v.sectors?.length) {
    const seats = seatRows(id, v.sectors, tierIdsByOrder(tierData ?? []));
    if (seats.length) {
      const { error: sErr } = await supabase.from("seats").insert(seats);
      if (sErr) return { ok: false, error: `Falha ao salvar o mapa de assentos: ${sErr.message}` };
    }
  }

  revalidatePath("/produtor/eventos");
  revalidatePath("/agenda");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<EventFormState> {
  const auth = await authorize();
  if (!auth) return { ok: false, error: "Sem permissão." };

  const supabase = await createClient();
  if (auth.role === "producer") {
    const { data: ev } = await supabase.from("events").select("producer_id").eq("id", id).single();
    if (!ev || ev.producer_id !== auth.user.id) return { ok: false, error: "Evento não é seu." };
  }

  await supabase.from("ticket_tiers").delete().eq("event_id", id);
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.message.includes("foreign key")
        ? "Evento tem pedidos/ingressos vinculados — cancele em vez de excluir."
        : error.message,
    };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/produtor");
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}

export async function setFeatured(id: string, featured: boolean): Promise<EventFormState> {
  const { user, role } = await getAuth();
  if (!user || role !== "admin") return { ok: false, error: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ is_featured: featured }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/eventos");
  revalidatePath("/");
  return { ok: true };
}
