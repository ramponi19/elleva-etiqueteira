"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const TierSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
});

const EventSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  category: z.enum(["SHOW", "FESTA", "ESPORTE", "TEATRO", "CORPORATIVO", "CURSO"]),
  venue: z.string().min(1, "Local obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Horário obrigatório"),
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
  const starts_at = `${v.date}T${v.time}:00-03:00`;
  let slug = slugify(v.title);

  // garante slug único
  const { data: exists } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
  if (exists) slug = `${slug}-${Math.floor(Date.now() % 100000)}`;

  const { data: ev, error } = await supabase
    .from("events")
    .insert({
      slug,
      title: v.title,
      description: v.description || null,
      category: v.category,
      venue: v.venue,
      city: v.city,
      starts_at,
      icon: v.icon || "solar:ticket-bold-duotone",
      cover_url: v.coverUrl ?? null,
      status: v.status,
      producer_id: auth.user.id,
    })
    .select("id, slug")
    .single();

  if (error || !ev) return { ok: false, error: error?.message ?? "Falha ao criar evento" };

  const { error: tErr } = await supabase.from("ticket_tiers").insert(
    v.tiers.map((t, i) => ({
      event_id: ev.id,
      name: t.name,
      description: t.description || null,
      price: t.price,
      capacity: t.capacity ?? null,
      sort_order: i,
    }))
  );
  if (tErr) return { ok: false, error: tErr.message };

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
  const starts_at = `${v.date}T${v.time}:00-03:00`;

  const { error } = await supabase
    .from("events")
    .update({
      title: v.title,
      description: v.description || null,
      category: v.category,
      venue: v.venue,
      city: v.city,
      starts_at,
      icon: v.icon || "solar:ticket-bold-duotone",
      cover_url: v.coverUrl ?? null,
      status: v.status,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // substitui os lotes (simples para MVP)
  await supabase.from("ticket_tiers").delete().eq("event_id", id);
  const { error: tErr } = await supabase.from("ticket_tiers").insert(
    v.tiers.map((t, i) => ({
      event_id: id,
      name: t.name,
      description: t.description || null,
      price: t.price,
      capacity: t.capacity ?? null,
      sort_order: i,
    }))
  );
  if (tErr) return { ok: false, error: tErr.message };

  revalidatePath("/produtor/eventos");
  revalidatePath("/agenda");
  return { ok: true };
}
