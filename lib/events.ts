// ============================================================
// Elleva Tickets — domain data & types
// Mock data — substituir por API/DB real quando formos plugar dados.
// ============================================================

export type CategoryLabel =
  | "SHOW" | "FESTA" | "ESPORTE" | "TEATRO" | "CORPORATIVO" | "CURSO";

export interface Tier {
  id: string;
  name: string;
  desc: string;
  price: number; // BRL, integer
}

export interface EventItem {
  id: string;
  title: string;
  d: string;          // dia, ex. "12"
  mon: string;        // mês abreviado, ex. "JUL"
  dateFull: string;   // ex. "12 JUL · SÁB"
  time: string;       // ex. "19:30"
  venueCity: string;  // ex. "Teatro Municipal · Mogi Mirim"
  catLabel: CategoryLabel;
  icon: string;       // Iconify id usado como glifo do pôster
  priceFrom: number;  // BRL, integer
  desc: string;
}

// Tiers compartilhados entre eventos neste mock.
// Em produção, anexar tiers por evento.
export const TIERS: Tier[] = [
  { id: "pista", name: "Pista", desc: "Acesso à área geral", price: 90 },
  { id: "vip", name: "VIP", desc: "Área elevada + open bar", price: 160 },
  { id: "camarote", name: "Camarote", desc: "Vista privilegiada + lounge", price: 280 },
];

export const EVENTS: EventItem[] = [
  {
    id: "rita",
    title: "Ana Cañas canta Rita Lee",
    d: "12", mon: "JUL", dateFull: "12 JUL · SÁB", time: "19:30",
    venueCity: "Teatro Municipal · Mogi Mirim",
    catLabel: "SHOW", icon: "solar:microphone-large-bold-duotone", priceFrom: 90,
    desc: "Uma celebração intimista do rock brasileiro, revisitando os clássicos de Rita Lee em arranjos exclusivos.",
  },
  {
    id: "ligajoe",
    title: "Liga Joe — Clube Mogiano",
    d: "08", mon: "AGO", dateFull: "08 AGO · SÁB", time: "20:00",
    venueCity: "Clube Mogiano · Mogi Mirim",
    catLabel: "FESTA", icon: "solar:disco-ball-bold-duotone", priceFrom: 60,
    desc: "A noite mais aguardada do interior. Line-up completo, estrutura premium e open de pista.",
  },
  {
    id: "copa",
    title: "Copa Tijuca: Brasil x Marrocos",
    d: "23", mon: "AGO", dateFull: "23 AGO · DOM", time: "12:00",
    venueCity: "Arena · Mogi Guaçu",
    catLabel: "ESPORTE", icon: "solar:ball-bold-duotone", priceFrom: 40,
    desc: "Futebol de base de alto nível em um confronto internacional imperdível para toda a família.",
  },
  {
    id: "standup",
    title: "Stand-up Comedy Night",
    d: "28", mon: "SET", dateFull: "28 SET · DOM", time: "20:00",
    venueCity: "Teatro · Americana",
    catLabel: "TEATRO", icon: "solar:masks-bold-duotone", priceFrom: 50,
    desc: "Uma noite de humor afiado com os melhores comediantes do circuito nacional.",
  },
  {
    id: "rodolfinho",
    title: "Nosso Quintal — MC Rodolfinho",
    d: "14", mon: "SET", dateFull: "14 SET · DOM", time: "22:30",
    venueCity: "Nosso Quintal · Itapira",
    catLabel: "SHOW", icon: "solar:music-notes-bold-duotone", priceFrom: 70,
    desc: "O fenômeno do funk em um show especial e energético no palco do Nosso Quintal.",
  },
  {
    id: "summit",
    title: "Summit Tech Interior 2026",
    d: "05", mon: "OUT", dateFull: "05 OUT · DOM", time: "09:00",
    venueCity: "Centro de Convenções · Americana",
    catLabel: "CORPORATIVO", icon: "solar:presentation-graph-bold-duotone", priceFrom: 120,
    desc: "O maior encontro de tecnologia e inovação do interior, com palestras, painéis e networking.",
  },
];

export const CATEGORIES = [
  "Shows & música",
  "Festas & baladas",
  "Esportes",
  "Teatro & cultura",
  "Cursos & palestras",
  "Corporativo",
];

export function getEvent(id: string): EventItem | undefined {
  return EVENTS.find((e) => e.id === id);
}
