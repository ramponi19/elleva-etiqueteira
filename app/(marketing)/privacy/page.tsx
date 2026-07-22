import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

const SECOES = [
  { t: "1. Dados que coletamos", d: "Coletamos os dados que você fornece ao criar conta e comprar (nome, e-mail, CPF) e dados de uso necessários para operar a plataforma e processar pagamentos." },
  { t: "2. Como usamos", d: "Usamos seus dados para processar compras, enviar ingressos e comunicações relacionadas ao evento, e cumprir obrigações legais. Não vendemos seus dados." },
  { t: "3. Compartilhamento", d: "Compartilhamos dados apenas com o produtor do evento comprado e com provedores necessários (pagamento, e-mail, hospedagem), conforme necessário para a operação." },
  { t: "4. Seus direitos (LGPD)", d: "Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail abaixo." },
  { t: "5. Cookies", d: "Usamos cookies essenciais para manter sua sessão (login e compra) e, somente com o seu consentimento, cookies de medição de audiência. Você pode recusar os cookies de medição no aviso exibido no site sem perder nenhuma função." },
  { t: "6. Contato", d: "Encarregado de dados: contato@ellevaeventos.com.br." },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-10">
      <h1 className="display-2 text-tinta">Política de <span className="text-sol">Privacidade</span></h1>
      <p className="corpo-suave mt-2">Última atualização: 2026. Modelo inicial — revisar com o jurídico (LGPD) antes de publicar.</p>
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
