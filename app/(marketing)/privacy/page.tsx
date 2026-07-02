import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "48px 48px 80px" }}>
      <h1 className="h1" style={{ fontSize: 40 }}>Política de <span className="serif accent-gold">Privacidade</span></h1>
      <p className="body" style={{ marginTop: 8, color: "var(--text-tertiary)" }}>
        Última atualização: 2026. Modelo inicial — revisar com o jurídico (LGPD) antes de publicar.
      </p>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>1. Dados que coletamos</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Coletamos os dados que você fornece ao criar conta e comprar (nome, e-mail, CPF) e
            dados de uso necessários para operar a plataforma e processar pagamentos.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>2. Como usamos</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Usamos seus dados para processar compras, enviar ingressos e comunicações relacionadas
            ao evento, e cumprir obrigações legais. Não vendemos seus dados.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>3. Compartilhamento</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Compartilhamos dados apenas com o produtor do evento comprado e com provedores
            necessários (pagamento, e-mail, hospedagem), conforme necessário para a operação.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>4. Seus direitos (LGPD)</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento
            pelo e-mail abaixo.
          </p>
        </section>
        <section>
          <h3 className="h3" style={{ fontSize: 20 }}>5. Contato</h3>
          <p className="body" style={{ marginTop: 8 }}>
            Encarregado de dados: contato@elleva.com.br.
          </p>
        </section>
      </div>
    </div>
  );
}
