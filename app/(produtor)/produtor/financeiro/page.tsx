import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/format";
import Icon from "@/components/shared/icon";
import { PayoutAccountForm } from "@/components/elleva/payout-account-form";

export const metadata: Metadata = { title: "Financeiro · Produtor" };

type ItemRow = {
  event_id: string | null;
  unit_price: number;
  quantity: number;
  events: { starts_at: string } | { starts_at: string }[] | null;
};
const ev = (r: ItemRow) => (Array.isArray(r.events) ? r.events[0] : r.events);
const jaOcorreu = (iso?: string) => !!iso && new Date(iso).getTime() < Date.now();

export default async function ProdutorFinanceiro() {
  const { user, role } = await getAuth();
  const supabase = await createClient();

  // eventos do produtor
  let evq = supabase.from("events").select("id").order("starts_at", { ascending: false });
  if (role === "producer") evq = evq.eq("producer_id", user!.id);
  const { data: events } = await evq;
  const ids = (events ?? []).map((e) => e.id);

  let items: ItemRow[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("order_items")
      .select("event_id, unit_price, quantity, orders!inner(status), events(starts_at)")
      .in("event_id", ids)
      .eq("orders.status", "paid");
    items = (data ?? []) as unknown as ItemRow[];
  }

  let liberado = 0; // eventos já realizados → disponível para repasse
  let aLiberar = 0; // eventos futuros → ainda retido
  for (const i of items) {
    const val = Number(i.unit_price) * i.quantity;
    if (jaOcorreu(ev(i)?.starts_at)) liberado += val;
    else aLiberar += val;
  }

  const { data: payoutsData } = await supabase
    .from("payouts")
    .select("amount, status, note, created_at")
    .order("created_at", { ascending: false });
  const payouts = payoutsData ?? [];
  const repassado = payouts.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0);
  const disponivel = Math.max(0, liberado - repassado);

  const { data: prof } = await supabase
    .from("profiles")
    .select("payout_pix_key, payout_pix_type, payout_holder, payout_doc")
    .eq("id", user!.id)
    .single();

  const conta = {
    pixType: prof?.payout_pix_type ?? "cpf",
    pixKey: prof?.payout_pix_key ?? "",
    holder: prof?.payout_holder ?? "",
    doc: prof?.payout_doc ?? "",
  };

  const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white";

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Financeiro</h1>
      <p className="corpo-suave mb-6 mt-1">Seu saldo, repasses e conta de recebimento.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${card} p-5`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-sol">
            <Icon icon="lucide:wallet" style={{ fontSize: 20 }} />
          </span>
          <p className="corpo-suave mt-3">Disponível para repasse</p>
          <p className="numero mt-0.5 text-[26px] text-tinta">{fmtBRL(disponivel)}</p>
          <p className="corpo-suave mt-1 text-[12px]">de eventos já realizados</p>
        </div>
        <div className={`${card} p-5`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-tinta-60">
            <Icon icon="lucide:hourglass" style={{ fontSize: 20 }} />
          </span>
          <p className="corpo-suave mt-3">A liberar</p>
          <p className="numero mt-0.5 text-[26px] text-tinta">{fmtBRL(aLiberar)}</p>
          <p className="corpo-suave mt-1 text-[12px]">libera após cada evento</p>
        </div>
        <div className={`${card} p-5`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-tinta text-palco">
            <Icon icon="lucide:check-check" style={{ fontSize: 20 }} />
          </span>
          <p className="corpo-suave mt-3">Já repassado</p>
          <p className="numero mt-0.5 text-[26px] text-tinta">{fmtBRL(repassado)}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Conta de repasse (Pix)</h2>
      <div className={`${card} p-6`}>
        <PayoutAccountForm initial={conta} />
      </div>

      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-tinta">Extrato de repasses</h2>
      <div className={card}>
        {payouts.length === 0 ? (
          <p className="corpo-suave px-5 py-12 text-center">
            Nenhum repasse ainda. O valor dos eventos realizados fica disponível aqui e é
            transferido para sua conta Pix após o evento.
          </p>
        ) : (
          payouts.map((p, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i ? "border-t-[1.5px] border-dashed border-tinta" : ""}`}>
              <div>
                <p className="m-0 text-[14px] font-medium text-tinta">{p.note || "Repasse"}</p>
                <p className="corpo-suave m-0">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className="numero text-[15px] text-tinta">{fmtBRL(Number(p.amount))}</span>
            </div>
          ))
        )}
      </div>

      <p className="corpo-suave mt-4">
        Hoje o repasse é feito manualmente pela Elleva após o evento, para a chave Pix cadastrada
        acima. Em breve: repasse automático.
      </p>
    </div>
  );
}
