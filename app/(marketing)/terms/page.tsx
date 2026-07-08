import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

const SECOES = [
  { t: "1. Sobre a plataforma", d: "A Elleva Tickets é uma plataforma de venda de ingressos que conecta produtores de eventos ao público. Ao usar a plataforma, você concorda com estes termos." },
  { t: "2. Compra de ingressos", d: "Os ingressos são vendidos pelos produtores dos eventos. A confirmação da compra é enviada por e-mail e fica disponível na sua conta. Preços e taxas são exibidos antes da finalização do pagamento." },
  { t: "3. Cancelamento e reembolso", d: "As condições de cancelamento e reembolso seguem a legislação vigente e a política de cada evento. Salvo indicação em contrário, ingressos podem não ser reembolsáveis após a confirmação." },
  { t: "4. Responsabilidades", d: "O produtor é responsável pela realização do evento. A Elleva Tickets atua como intermediadora da venda e do pagamento." },
  { t: "5. Contato", d: "Dúvidas sobre estes termos: contato@elleva.com.br." },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-10">
      <h1 className="display-2 text-tinta">Termos de <span className="text-sol">Uso</span></h1>
      <p className="corpo-suave mt-2">Última atualização: 2026. Modelo inicial — revisar com o jurídico antes de publicar.</p>
      <div className="mt-8 flex flex-col gap-6">
        {SECOES.map((s) => (
          <section key={s.t}>
            <h2 className="text-[19px] font-extrabold text-tinta">{s.t}</h2>
            <p className="corpo mt-2">{s.d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
