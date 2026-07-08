import type { Metadata } from "next";

export const metadata: Metadata = { title: "Central de Ajuda" };

const FAQ = [
  { t: "Como recebo meus ingressos?", d: "Após a confirmação do pagamento, seus ingressos ficam em Meus ingressos, com o QR code para apresentar na entrada do evento. Também enviamos por e-mail." },
  { t: "Como faço para criar um evento?", d: "No menu, clique em Criar evento. Sua conta é habilitada como produtora automaticamente e você poderá cadastrar o evento e os lotes de ingressos." },
  { t: "Cancelamento e reembolso", d: "As condições seguem a legislação vigente e a política de cada evento. Consulte a página do evento para detalhes." },
  { t: "Falar com a gente", d: "Precisa de ajuda com um pedido? Escreva para contato@elleva.com.br que retornamos o mais rápido possível." },
];

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-10">
      <h1 className="display-2 text-tinta">Central de <span className="text-sol">Ajuda</span></h1>
      <p className="corpo-suave mt-2">Tire suas dúvidas sobre compras, ingressos e eventos.</p>
      <div className="mt-8 flex flex-col gap-6">
        {FAQ.map((s) => (
          <section key={s.t}>
            <h2 className="text-[19px] font-extrabold text-tinta">{s.t}</h2>
            <p className="corpo mt-2">{s.d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
