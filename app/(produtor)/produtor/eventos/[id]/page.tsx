import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/page-header";
import EventForm, { type EventFormInitial } from "@/components/app/event-form";

export const metadata: Metadata = { title: "Editar evento" };

function splitDate(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export default async function EditarEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ev } = await supabase
    .from("events")
    .select("id, title, description, category, venue, city, starts_at, status, cover_url, ticket_tiers(name, description, price, capacity, sort_order)")
    .eq("id", id)
    .single();

  if (!ev) notFound();

  const { date, time } = splitDate(ev.starts_at);
  const tiers = (ev.ticket_tiers ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((t: { name: string; description: string | null; price: number; capacity: number | null }) => ({
      name: t.name,
      description: t.description ?? "",
      price: String(t.price),
      capacity: t.capacity ? String(t.capacity) : "",
    }));

  const initial: EventFormInitial = {
    id: ev.id,
    title: ev.title,
    description: ev.description ?? "",
    category: ev.category,
    venue: ev.venue,
    city: ev.city,
    date,
    time,
    status: ev.status,
    coverUrl: ev.cover_url ?? "",
    tiers: tiers.length ? tiers : [{ name: "Pista", description: "", price: "", capacity: "" }],
  };

  return (
    <>
      <PageHeader title="Editar evento" subtitle={ev.title} />
      <main style={{ padding: 32 }}>
        <EventForm initial={initial} />
      </main>
    </>
  );
}
