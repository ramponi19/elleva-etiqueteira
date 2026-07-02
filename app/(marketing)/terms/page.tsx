import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "48px 48px 80px" }}>
      <h1 className="h1" style={{ fontSize: 40 }}>Termos de <span className="serif accent-gold">Uso</span></h1>
      <p className="body" style={{ marginTop: 8, color: "var(--text-tertiary)" }}>
        Última atualização: 2026. Modelo inicial — revisar com o jurídico antes de publicar.
      </p>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>1. Sobre a plataforma</h3>
          <p className="body" style={{ marginTop: 8 }}>
            A Elleva Tickets é uma plataforma de venda de ingressos que conecta produtores de
            eventos ao público. Ao usar a plataforma, você concorda com estes termos.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>2. Compra de ingressos</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Os ingressos são vendidos pelos produtores dos eventos. A confirmação da compra é
            enviada por e-mail e fica disponível na sua conta. Preços e taxas são exibidos antes
            da finalização do pagamento.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>3. Cancelamento e reembolso</h3>
          <p className="body" style={{ marginTop: 8 }}>
            As condições de cancelamento e reembolso seguem a legislação vigente e a política de
            cada evento. Salvo indicação em contrário, ingressos podem não ser reembolsáveis após
            a confirmação.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>4. Responsabilidades</h3>
          <p className="body" style={{ marginTop: 8 }}>
            O produtor é responsável pela realização do evento. A Elleva Tickets atua como
            intermediadora da venda e do pagamento.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>5. Contato</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Dúvidas sobre estes termos: contato@elleva.com.br.
          </p>
        </section>
      </div>
    </div>
  );
}
