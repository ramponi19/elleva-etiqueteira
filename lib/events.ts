// ============================================================
// Elleva Tickets — camada de dados de eventos
// Lê do Supabase; cai para mock se faltar credencial ou der erro.
// ============================================================
import { createClient } from "@/lib/supabase/server";

export type CategoryLabel =
  | "SHOW" | "FESTA" | "ESPORTE" | "TEATRO" | "CORPORATIVO" | "CURSO";

export interface Tier {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export interface EventItem {
  id: string;          // = slug (usado na rota /evento/[id])
  title: string;
  d: string;           // dia, ex. "12"
  mon: string;         // mês abreviado, ex. "JUL"
  dateFull: string;    // ex. "12 JUL · SÁB"
  time: string;        // ex. "19:30"
  venueCity: string;   // ex. "Teatro Municipal · Mogi Mirim"
  catLabel: CategoryLabel;
  icon: string;
  priceFrom: number;
  desc: string;
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
  slug: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  venue: string;
  city: string;
  starts_at: string;
  ticket_tiers?: { price: number }[];
};

function toEventItem(row: EventDbRow): EventItem {
  const { d, mon, time, dateFull } = dateParts(row.starts_at);
  const prices = (row.ticket_tiers ?? []).map((t) => Number(t.price));
  return {
    id: row.slug,
    title: row.title,
    d, mon, time, dateFull,
    venueCity: `${row.venue} · ${row.city}`,
    catLabel: row.category as CategoryLabel,
    icon: row.icon ?? "solar:ticket-bold-duotone",
    priceFrom: prices.length ? Math.min(...prices) : 0,
    desc: row.description ?? "",
  };
}

// ---------- Queries ----------
export async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("slug, title, description, category, icon, venue, city, starts_at, ticket_tiers(price)")
      .in("status", ["published", "sold_out"])
      .order("starts_at", { ascending: true });
    if (error || !data?.length) return MOCK_EVENTS;
    return (data as EventDbRow[]).map(toEventItem);
  } catch {
    return MOCK_EVENTS;
  }
}

export async function getEvent(
  slug: string
): Promise<{ event: EventItem; tiers: Tier[] } | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("slug, title, description, category, icon, venue, city, starts_at, ticket_tiers(id, name, description, price, sort_order)")
      .eq("slug", slug)
      .in("status", ["published", "sold_out"])
      .single();
    if (error || !data) return mockEventBySlug(slug);

    const row = data as EventDbRow & {
      ticket_tiers: { id: string; name: string; description: string | null; price: number; sort_order: number }[];
    };
    const tiers: Tier[] = [...row.ticket_tiers]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({ id: t.id, name: t.name, desc: t.description ?? "", price: Number(t.price) }));
    return { event: toEventItem(row), tiers };
  } catch {
    return mockEventBySlug(slug);
  }
}

export async function getEventSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("slug")
      .in("status", ["published", "sold_out"]);
    if (error || !data?.length) return MOCK_EVENTS.map((e) => e.id);
    return data.map((r) => r.slug as string);
  } catch {
    return MOCK_EVENTS.map((e) => e.id);
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
  { id: "rita", title: "Ana Cañas canta Rita Lee", d: "12", mon: "JUL", dateFull: "12 JUL · SÁB", time: "19:30", venueCity: "Teatro Municipal · Mogi Mirim", catLabel: "SHOW", icon: "solar:microphone-large-bold-duotone", priceFrom: 90, desc: "Uma celebração intimista do rock brasileiro, revisitando os clássicos de Rita Lee em arranjos exclusivos." },
  { id: "ligajoe", title: "Liga Joe — Clube Mogiano", d: "08", mon: "AGO", dateFull: "08 AGO · SÁB", time: "20:00", venueCity: "Clube Mogiano · Mogi Mirim", catLabel: "FESTA", icon: "solar:disco-ball-bold-duotone", priceFrom: 60, desc: "A noite mais aguardada do interior. Line-up completo, estrutura premium e open de pista." },
  { id: "copa", title: "Copa Tijuca: Brasil x Marrocos", d: "23", mon: "AGO", dateFull: "23 AGO · DOM", time: "12:00", venueCity: "Arena · Mogi Guaçu", catLabel: "ESPORTE", icon: "solar:ball-bold-duotone", priceFrom: 40, desc: "Futebol de base de alto nível em um confronto internacional imperdível para toda a família." },
  { id: "rodolfinho", title: "Nosso Quintal — MC Rodolfinho", d: "14", mon: "SET", dateFull: "14 SET · DOM", time: "22:30", venueCity: "Nosso Quintal · Itapira", catLabel: "SHOW", icon: "solar:music-notes-bold-duotone", priceFrom: 70, desc: "O fenômeno do funk em um show especial e energético no palco do Nosso Quintal." },
  { id: "standup", title: "Stand-up Comedy Night", d: "28", mon: "SET", dateFull: "28 SET · DOM", time: "20:00", venueCity: "Teatro · Americana", catLabel: "TEATRO", icon: "solar:masks-bold-duotone", priceFrom: 50, desc: "Uma noite de humor afiado com os melhores comediantes do circuito nacional." },
  { id: "summit", title: "Summit Tech Interior 2026", d: "05", mon: "OUT", dateFull: "05 OUT · DOM", time: "09:00", venueCity: "Centro de Convenções · Americana", catLabel: "CORPORATIVO", icon: "solar:presentation-graph-bold-duotone", priceFrom: 120, desc: "O maior encontro de tecnologia e inovação do interior, com palestras, painéis e networking." },
];

function mockTiers(priceFrom: number): Tier[] {
  return [
    { id: "pista", name: "Pista", desc: "Acesso à área geral", price: priceFrom },
    { id: "vip", name: "VIP", desc: "Área elevada + open bar", price: priceFrom + 70 },
    { id: "camarote", name: "Camarote", desc: "Vista privilegiada + lounge", price: priceFrom + 190 },
  ];
}

function mockEventBySlug(slug: string): { event: EventItem; tiers: Tier[] } | null {
  const event = MOCK_EVENTS.find((e) => e.id === slug);
  return event ? { event, tiers: mockTiers(event.priceFrom) } : null;
}
