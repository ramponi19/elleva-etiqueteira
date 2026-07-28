// ============================================================
// Elleva Tickets — camada de dados de eventos
// Lê do Supabase; cai para mock APENAS fora de produção.
// ============================================================
import { createClient } from "@/lib/supabase/server";

// Fail-safe: em produção, banco vazio ou query com erro NÃO pode servir os
// eventos de demonstração (apareciam na home, na agenda e no sitemap.xml).
const mockEventsAllowed = () =>
  process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_EVENTS === "1";

export type CategoryLabel =
  | "SHOW" | "FESTA" | "ESPORTE" | "TEATRO" | "CORPORATIVO" | "CURSO";

export interface Tier {
  id: string;
  name: string;
  desc: string;
  price: number;
  available: number | null; // null = ilimitado
  sold: number;             // pra "m pessoas já garantiram" (§11)
  isAddon: boolean;         // produto (copo/camiseta) — não gera QR
}

export interface EventItem {
  id: string;          // = slug (usado na rota /evento/[id])
  uuid: string;        // id real (uuid) no banco; = slug no mock
  title: string;
  d: string;           // dia, ex. "12"
  mon: string;         // mês abreviado, ex. "JUL"
  dateFull: string;    // ex. "12 JUL · SÁB"
  time: string;        // ex. "19:30"
  venueCity: string;   // ex. "Teatro Municipal · Mogi Mirim"
  catLabel: CategoryLabel;
  icon: string;
  cover: string | null;
  soldOut: boolean;
  priceFrom: number;
  desc: string;
  featured: boolean;
  featuredOrder: number;
  /** nº de série visual do cartaz (Nº 0042); ver lib/arte.numeroSerie */
  serial: number;
  /** início em ISO 8601 (JSON-LD schema.org/Event) */
  startsAtISO: string;
  /** taxa de serviço (%) paga pelo comprador — events.service_fee_pct */
  feePct: number;
  /** nº máximo de parcelas no cartão — events.max_installments (padrão 12) */
  maxInstallments?: number;
  /** IDs de rastreamento por evento (Meta Pixel / GA) */
  trackingMetaPixel?: string | null;
  trackingGa?: string | null;
  /** tema da página (sobrepõe a cor da categoria); null = automático */
  theme?: string | null;
  /** assentos marcados ativados neste evento (events.has_seating) */
  hasSeating?: boolean;
}

/** Um assento do mapa (quando o evento tem assentos marcados). */
export interface Seat {
  id: string;
  tierId: string | null;
  sector: string;
  rowLabel: string;
  seatNum: number;
  label: string;   // ex. "A12"
  posRow: number;
  posCol: number;
  taken: boolean;  // vendido ou em reserva ativa — não selecionável
}

// ---------- Formatação de data (America/Sao_Paulo) ----------
const MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const WD: Record<string, string> = {
  Sun: "DOM", Mon: "SEG", Tue: "TER", Wed: "QUA", Thu: "QUI", Fri: "SEX", Sat: "SÁB",
};

function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    weekday: "short", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const d = get("day");
  const mon = MONTHS[parseInt(get("month"), 10) - 1] ?? "";
  const time = `${get("hour")}:${get("minute")}`;
  const dateFull = `${d} ${mon} · ${WD[get("weekday")] ?? ""}`;
  return { d, mon, time, dateFull };
}

type EventDbRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  venue: string;
  city: string;
  starts_at: string;
  status?: string;
  cover_url?: string | null;
  is_featured?: boolean;
  featured_order?: number;
  ticket_tiers?: { price: number }[];
  serial?: number;
  service_fee_pct?: number;
  max_installments?: number;
  tracking_meta_pixel?: string | null;
  tracking_ga?: string | null;
  theme?: string | null;
  has_seating?: boolean;
};

// Serial derivado do uuid enquanto a migration 0018 (coluna events.serial)
// não é aplicada no banco — determinístico, só pra arte nunca ficar sem Nº.
function serialFallback(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9000;
  return h + 1;
}

function toEventItem(row: EventDbRow): EventItem {
  const { d, mon, time, dateFull } = dateParts(row.starts_at);
  const prices = (row.ticket_tiers ?? []).map((t) => Number(t.price));
  return {
    id: row.slug,
    uuid: row.id,
    title: row.title,
    d, mon, time, dateFull,
    venueCity: `${row.venue} · ${row.city}`,
    catLabel: row.category as CategoryLabel,
    icon: row.icon ?? "solar:ticket-bold-duotone",
    cover: row.cover_url ?? null,
    soldOut: row.status === "sold_out",
    priceFrom: prices.length ? Math.min(...prices) : 0,
    desc: row.description ?? "",
    featured: row.is_featured ?? false,
    featuredOrder: row.featured_order ?? 0,
    serial: row.serial ?? serialFallback(row.id),
    startsAtISO: row.starts_at,
    feePct: Number(row.service_fee_pct ?? 10),
    maxInstallments: Number(row.max_installments ?? 12),
    trackingMetaPixel: row.tracking_meta_pixel ?? null,
    trackingGa: row.tracking_ga ?? null,
    theme: row.theme ?? null,
    hasSeating: row.has_seating ?? false,
  };
}

// ---------- Queries ----------
export async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, slug, title, description, category, icon, venue, city, starts_at, status, cover_url, is_featured, featured_order, serial, service_fee_pct, ticket_tiers(price)")
      .in("status", ["published", "sold_out"])
      .or("visibility.eq.public,visibility.is.null") // privado só pelo link direto
      .order("starts_at", { ascending: true });
    if (error || !data?.length) return mockEventsAllowed() ? MOCK_EVENTS : [];
    return (data as EventDbRow[]).map(toEventItem);
  } catch {
    return mockEventsAllowed() ? MOCK_EVENTS : [];
  }
}

/** Eventos em destaque para o carrossel da home, escolhidos no admin. */
export async function getFeaturedEvents(): Promise<EventItem[]> {
  const events = await getEvents();
  const featured = events
    .filter((e) => e.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
  return featured.length ? featured : events.slice(0, 6);
}

export async function getEvent(
  slug: string
): Promise<{ event: EventItem; tiers: Tier[] } | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, slug, title, description, category, icon, venue, city, starts_at, status, cover_url, serial, service_fee_pct, max_installments, tracking_meta_pixel, tracking_ga, theme, has_seating, ticket_tiers(id, name, description, price, sort_order, capacity, sold, is_addon)")
      .eq("slug", slug)
      .in("status", ["published", "sold_out"])
      .single();
    if (error || !data) return mockEventBySlug(slug);

    const row = data as EventDbRow & {
      ticket_tiers: { id: string; name: string; description: string | null; price: number; sort_order: number; capacity: number | null; sold: number; is_addon?: boolean }[];
    };
    const tiers: Tier[] = [...row.ticket_tiers]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        id: t.id,
        name: t.name,
        desc: t.description ?? "",
        price: Number(t.price),
        available: t.capacity == null ? null : Math.max(0, t.capacity - (t.sold ?? 0)),
        sold: t.sold ?? 0,
        isAddon: !!t.is_addon,
      }));
    return { event: toEventItem(row), tiers };
  } catch {
    return mockEventBySlug(slug);
  }
}

/** Mapa de assentos de um evento (vazio se o evento não usa assentos marcados). */
export async function getSeats(eventId: string): Promise<Seat[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seats")
      .select("id, tier_id, sector, row_label, seat_num, label, pos_row, pos_col, status, held_until")
      .eq("event_id", eventId)
      .order("sector", { ascending: true })
      .order("pos_row", { ascending: true })
      .order("pos_col", { ascending: true });
    if (error || !data) return [];
    const now = Date.now();
    return data.map((s) => ({
      id: s.id as string,
      tierId: (s.tier_id as string | null) ?? null,
      sector: (s.sector as string) ?? "",
      rowLabel: s.row_label as string,
      seatNum: s.seat_num as number,
      label: s.label as string,
      posRow: (s.pos_row as number) ?? 0,
      posCol: (s.pos_col as number) ?? 0,
      taken:
        s.status === "sold" ||
        (s.status === "held" && !!s.held_until && new Date(s.held_until as string).getTime() > now),
    }));
  } catch {
    return [];
  }
}

export async function getEventSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("slug")
      .in("status", ["published", "sold_out"])
      .or("visibility.eq.public,visibility.is.null"); // privado fora do sitemap
    if (error || !data?.length) return mockEventsAllowed() ? MOCK_EVENTS.map((e) => e.id) : [];
    return data.map((r) => r.slug as string);
  } catch {
    return mockEventsAllowed() ? MOCK_EVENTS.map((e) => e.id) : [];
  }
}

export const CATEGORIES = [
  "Shows & música",
  "Festas & baladas",
  "Esportes",
  "Teatro & cultura",
  "Cursos & palestras",
  "Corporativo",
];

// ============================================================
// Fallback mock (usado se o Supabase não estiver disponível)
// ============================================================
export const MOCK_EVENTS: EventItem[] = [
  { id: "rita", uuid: "rita", title: "Ana Cañas canta Rita Lee", d: "12", mon: "JUL", dateFull: "12 JUL · SÁB", time: "19:30", venueCity: "Teatro Municipal · Mogi Mirim", catLabel: "SHOW", icon: "solar:microphone-large-bold-duotone", cover: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 90, desc: "Uma celebração intimista do rock brasileiro, revisitando os clássicos de Rita Lee em arranjos exclusivos.", featured: true, featuredOrder: 0, serial: 1, startsAtISO: "2026-07-12T19:30:00-03:00", feePct: 10 },
  { id: "ligajoe", uuid: "ligajoe", title: "Liga Joe — Clube Mogiano", d: "08", mon: "AGO", dateFull: "08 AGO · SÁB", time: "20:00", venueCity: "Clube Mogiano · Mogi Mirim", catLabel: "FESTA", icon: "solar:disco-ball-bold-duotone", cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 60, desc: "A noite mais aguardada do interior. Line-up completo, estrutura premium e open de pista.", featured: true, featuredOrder: 1, serial: 2, startsAtISO: "2026-08-08T20:00:00-03:00", feePct: 10 },
  { id: "copa", uuid: "copa", title: "Copa Tijuca: Brasil x Marrocos", d: "23", mon: "AGO", dateFull: "23 AGO · DOM", time: "12:00", venueCity: "Arena · Mogi Guaçu", catLabel: "ESPORTE", icon: "solar:ball-bold-duotone", cover: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 40, desc: "Futebol de base de alto nível em um confronto internacional imperdível para toda a família.", featured: true, featuredOrder: 2, serial: 3, startsAtISO: "2026-08-23T12:00:00-03:00", feePct: 10 },
  { id: "rodolfinho", uuid: "rodolfinho", title: "Nosso Quintal — MC Rodolfinho", d: "14", mon: "SET", dateFull: "14 SET · DOM", time: "22:30", venueCity: "Nosso Quintal · Itapira", catLabel: "SHOW", icon: "solar:music-notes-bold-duotone", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 70, desc: "O fenômeno do funk em um show especial e energético no palco do Nosso Quintal.", featured: false, featuredOrder: 0, serial: 4, startsAtISO: "2026-09-14T22:30:00-03:00", feePct: 10 },
  { id: "standup", uuid: "standup", title: "Stand-up Comedy Night", d: "28", mon: "SET", dateFull: "28 SET · DOM", time: "20:00", venueCity: "Teatro · Americana", catLabel: "TEATRO", icon: "solar:masks-bold-duotone", cover: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 50, desc: "Uma noite de humor afiado com os melhores comediantes do circuito nacional.", featured: false, featuredOrder: 0, serial: 5, startsAtISO: "2026-09-28T20:00:00-03:00", feePct: 10 },
  { id: "summit", uuid: "summit", title: "Summit Tech Interior 2026", d: "05", mon: "OUT", dateFull: "05 OUT · DOM", time: "09:00", venueCity: "Centro de Convenções · Americana", catLabel: "CORPORATIVO", icon: "solar:presentation-graph-bold-duotone", cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=70", soldOut: false, priceFrom: 120, desc: "O maior encontro de tecnologia e inovação do interior, com palestras, painéis e networking.", featured: false, featuredOrder: 0, serial: 6, startsAtISO: "2026-10-05T09:00:00-03:00", feePct: 10 },
];

function mockTiers(priceFrom: number): Tier[] {
  return [
    { id: "pista", name: "Pista", desc: "Acesso à área geral", price: priceFrom, available: null, sold: 0, isAddon: false },
    { id: "vip", name: "VIP", desc: "Área elevada + open bar", price: priceFrom + 70, available: null, sold: 0, isAddon: false },
    { id: "camarote", name: "Camarote", desc: "Vista privilegiada + lounge", price: priceFrom + 190, available: null, sold: 0, isAddon: false },
  ];
}

function mockEventBySlug(slug: string): { event: EventItem; tiers: Tier[] } | null {
  const event = MOCK_EVENTS.find((e) => e.id === slug);
  return event ? { event, tiers: mockTiers(event.priceFrom) } : null;
}
