import type { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { TicketValidatorElleva } from "@/components/elleva/ticket-validator";
import { CheckinLinks } from "@/components/elleva/checkin-links";

export const metadata: Metadata = { title: "Validar ingresso · Produtor" };

export default async function ProdutorValidar() {
  const { user, role } = await getAuth();

  // Tokens de check-in são segredo (só service_role lê a coluna).
  let list: { id: string; title: string; token: string }[] = [];
  try {
    const svc = await createServiceClient();
    let q = svc.from("events").select("id, title, checkin_token").order("starts_at", { ascending: false });
    if (role === "producer") q = q.eq("producer_id", user!.id);
    const { data } = await q;
    list = (data ?? []).map((e) => ({ id: e.id, title: e.title, token: e.checkin_token as string }));
  } catch {
    list = [];
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="display-2 text-tinta">Validar ingresso</h1>
      <p className="corpo-suave mb-8 mt-1">
        Valide você mesmo ou compartilhe o link com a equipe da portaria.
      </p>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-[18px] font-extrabold text-tinta">Validar agora</h2>
          <TicketValidatorElleva />
        </div>
        <div>
          <h2 className="mb-1 text-[18px] font-extrabold text-tinta">Compartilhar com a equipe</h2>
          <p className="corpo-suave mb-4">
            Envie o link do evento para quem fica na porta. Não precisa de conta — abre no celular,
            escaneia e valida. Vários celulares ao mesmo tempo, sem limite.
          </p>
          <CheckinLinks events={list} />
        </div>
      </div>
    </div>
  );
}
