import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Início · Produtor" };

const STATUS: Record<string, { label: string; tom: "sol" | "tinta" | "papel" }> = {
  published: { label: "Publicado", tom: "sol" },
  draft: { label: "Rascunho", tom: "papel" },
  sold_out: { label: "Esgotado", tom: "tinta" },
  cancelled: { label: "Cancelado", tom: "tinta" },
};

function saudacao(): string {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date())
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function ProdutorInicio() {
  const { user, role, fullName } = await getAuth();
  const supabase = await createClient();

  let q = supabase
    .from("events")
    .select("id, title, category, city, starts_at, status")
    .order("starts_at", { ascending: true });
  if (role === "producer") q = q.eq("producer_id", user!.id);
  const { data: events } = await q;

  const { data: items } = await supabase
    .from("order_items")
    .select("unit_price, quantity, orders!inner(status)")
    .eq("orders.status", "paid");
  const rows = (items ?? []) as { unit_price: number; quantity: number }[];
  const revenue = rows.reduce((a, i) => a + Number(i.unit_price) * i.quantity, 0);
  const sold = rows.reduce((a, i) => a + i.quantity, 0);

  const first = (fullName ?? "").trim().split(/\s+/)[0] || "produtor";
  const lista = events ?? [];
  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  const stats = [
    { label: "Meus eventos", value: String(lista.length), icon: "lucide:ticket" },
    { label: "Ingressos vendidos", value: String(sold), icon: "lucide:tag" },
    { label: "Receita", value: fmtBRL(revenue), icon: "lucide:wallet" },
  ];

  return (
    <div className="p-6 sm:p-8">
      {/* Saudação + criar */}
      <div className={`${card} p-6 sm:p-8`}>
        <h1 className="display-2 text-tinta">{saudacao()}, {first}!</h1>
        <p className="corpo-suave mt-1">Já publicou seu evento?</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/criar-evento" variante="primario">
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Criar evento presencial
          </Button>
          <button
            type="button"
            disabled
            title="Em breve"
            className="inline-flex cursor-default items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-tinta px-[22px] py-3 text-[15px] font-medium text-tinta-35"
          >
            Criar evento online <span className="rotulo">· em breve</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-sol">
              <Icon icon={s.icon} style={{ fontSize: 20 }} />
            </span>
            <p className="corpo-suave mt-3">{s.label}</p>
            <p className="numero mt-0.5 text-[28px] text-tinta">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Aba + lista */}
      <div className="mt-8 border-b-[1.5px] border-tinta">
        <span className="rotulo -mb-[1.5px] inline-block border-b-[3px] border-sol px-1 pb-3 text-tinta">
          Meus eventos
        </span>
      </div>

      {!lista.length ? (
        <div className={`${card} mt-6 border-dashed px-6 py-16 text-center`}>
          <h2 className="titulo-card text-tinta">Publique um evento pela primeira vez!</h2>
          <p className="corpo-suave mx-auto mt-2 max-w-[420px]">
            Você tem total autonomia para cadastrar, gerenciar e acompanhar todas as informações do seu evento.
          </p>
          <Button href="/criar-evento" variante="primario" className="mt-6">
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Criar evento presencial
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((e) => {
            const s = STATUS[e.status] ?? { label: e.status, tom: "papel" as const };
            return (
              <Link
                key={e.id}
                href={`/produtor/eventos/${e.id}`}
                className={`${card} group flex flex-col transition-[transform,box-shadow] duration-200 [transition-timing-function:var(--ease-mola)] hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--color-tinta)]`}
              >
                <div className="flex items-start justify-between gap-2 p-4">
                  <Badge tom={s.tom}>{s.label}</Badge>
                  <Badge tom="papel">{e.category}</Badge>
                </div>
                <div className="flex flex-1 flex-col px-4 pb-4">
                  <h3 className="titulo-card text-tinta">{e.title}</h3>
                  <p className="corpo-suave mt-1">
                    {e.city} · {new Date(e.starts_at).toLocaleDateString("pt-BR")}
                  </p>
                  <span className="mt-3 flex items-center gap-1 text-[14px] font-medium text-sol-escuro">
                    Gerenciar <Icon icon="lucide:arrow-right" style={{ fontSize: 15 }} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
