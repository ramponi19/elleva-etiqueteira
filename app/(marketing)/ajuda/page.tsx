import type { Metadata } from "next";

export const metadata: Metadata = { title: "Central de Ajuda" };

export default function AjudaPage() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "48px 48px 80px" }}>
      <h1 className="h1" style={{ fontSize: 40 }}>Central de <span className="serif accent-gold">Ajuda</span></h1>
      <p className="body" style={{ marginTop: 8, color: "var(--text-tertiary)" }}>
        Tire suas dúvidas sobre compras, ingressos e eventos. Novos artigos em breve.
      </p>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>Como recebo meus ingressos?</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Após a confirmação do pagamento, seus ingressos ficam disponíveis em{" "}
            <strong>Meus ingressos</strong>, com o QR code para apresentar na entrada do evento.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>Como faço para criar um evento?</h3>
          <p className="body" style={{ marginTop: 8 }}>
            No menu, clique em <strong>Criar evento</strong>. Sua conta é habilitada como produtora
            automaticamente e você poderá cadastrar o evento e os lotes de ingressos.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>Cancelamento e reembolso</h3>
          <p className="body" style={{ marginTop: 8 }}>
            As condições seguem a legislação vigente e a política de cada evento. Consulte a página
            do evento para detalhes.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>Falar com a gente</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Precisa de ajuda com um pedido? Escreva para <strong>contato@elleva.com.br</strong> que
            retornamos o mais rápido possível.
          </p>
        </section>
      </div>
    </div>
  );
}
