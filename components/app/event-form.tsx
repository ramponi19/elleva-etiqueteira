"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/icon";
import { createEvent, updateEvent } from "@/lib/actions/events";

const CATEGORIES = ["SHOW", "FESTA", "ESPORTE", "TEATRO", "CORPORATIVO", "CURSO"];

interface TierInput {
  name: string;
  description: string;
  price: string;
  capacity: string;
}

export interface EventFormInitial {
  id?: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  status: string;
  tiers: TierInput[];
}

const empty: EventFormInitial = {
  title: "", description: "", category: "SHOW", venue: "", city: "",
  date: "", time: "", status: "published",
  tiers: [{ name: "Pista", description: "", price: "", capacity: "" }],
};

export default function EventForm({ initial }: { initial?: EventFormInitial }) {
  const router = useRouter();
  const data = initial ?? empty;
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<EventFormInitial>(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof EventFormInitial, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setTier = (i: number, k: keyof TierInput, v: string) =>
    setForm((f) => ({ ...f, tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, [k]: v } : t)) }));
  const addTier = () => setForm((f) => ({ ...f, tiers: [...f.tiers, { name: "", description: "", price: "", capacity: "" }] }));
  const rmTier = (i: number) => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category as "SHOW",
      venue: form.venue,
      city: form.city,
      date: form.date,
      time: form.time,
      status: form.status as "published" | "draft",
      tiers: form.tiers.map((t) => ({
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity || undefined,
      })),
    };
    const res = isEdit ? await updateEvent(initial!.id!, payload) : await createEvent(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Erro ao salvar");
      return;
    }
    router.push("/produtor/eventos");
    router.refresh();
  }

  const label = { display: "block", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".16em", color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase" as const };

  return (
    <form onSubmit={submit} style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={label}>Título</label>
        <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Nome do evento" />
      </div>
      <div>
        <label style={label}>Descrição</label>
        <textarea className="input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Sobre o evento" />
      </div>

      <div className="field-grid">
        <div>
          <label style={label}>Categoria</label>
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>
      </div>

      <div className="field-grid">
        <div>
          <label style={label}>Local</label>
          <input className="input" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Ex.: Teatro Municipal" />
        </div>
        <div>
          <label style={label}>Cidade</label>
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex.: Mogi Mirim" />
        </div>
      </div>

      <div className="field-grid">
        <div>
          <label style={label}>Data</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label style={label}>Horário</label>
          <input className="input" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
      </div>

      {/* Tiers */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ ...label, marginBottom: 0 }}>Lotes / ingressos</label>
          <button type="button" onClick={addTier} className="btn btn-ghost btn-sm">
            <Icon icon="lucide:plus" /> Adicionar lote
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {form.tiers.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr .8fr .8fr auto", gap: 8, alignItems: "center" }}>
              <input className="input" placeholder="Nome" value={t.name} onChange={(e) => setTier(i, "name", e.target.value)} />
              <input className="input" placeholder="Descrição" value={t.description} onChange={(e) => setTier(i, "description", e.target.value)} />
              <input className="input" type="number" placeholder="R$" value={t.price} onChange={(e) => setTier(i, "price", e.target.value)} />
              <input className="input" type="number" placeholder="Qtd" value={t.capacity} onChange={(e) => setTier(i, "capacity", e.target.value)} />
              <button type="button" onClick={() => rmTier(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} aria-label="Remover">
                <Icon icon="lucide:trash-2" style={{ fontSize: 18 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#d64545", background: "rgba(214,69,69,.08)", border: "1px solid rgba(214,69,69,.2)", borderRadius: 10, padding: "8px 12px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar evento"}
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
