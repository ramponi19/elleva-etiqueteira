import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCertificate } from "@/lib/certificates";
import { EllevaLogo } from "@/components/brand/EllevaLogo";
import { PrintButton } from "@/components/elleva/print-button";

export const metadata: Metadata = {
  title: "Certificado de participação",
  robots: { index: false, follow: false },
};

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) notFound();

  return (
    <main className="min-h-screen bg-papel-2 px-4 py-8 print:bg-white print:p-0">
      {/* barra de ações — some na impressão */}
      <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-between print:hidden">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-palco px-3 py-1.5 text-[13px] font-medium text-palco">
          ✓ Certificado válido
        </span>
        <PrintButton />
      </div>

      {/* o certificado */}
      <div className="mx-auto max-w-[900px] border-[2px] border-tinta bg-white p-8 sm:p-14 print:border-0 print:shadow-none">
        <div className="flex items-center justify-between">
          <span className="text-tinta"><EllevaLogo variant="horizontal" className="h-6 w-auto sm:h-8" /></span>
          <span className="rotulo text-tinta-60">{cert.dateLabel}</span>
        </div>

        <div className="mt-12 text-center sm:mt-16">
          <p className="rotulo text-sol-escuro">{cert.title}</p>
          <p className="display-2 mt-6 text-[34px] leading-tight text-tinta sm:text-[44px]">
            {cert.participantName}
          </p>
          <p className="corpo mx-auto mt-6 max-w-[620px] text-[16px] leading-relaxed text-tinta">
            {cert.body}
          </p>
          {cert.hours && (
            <p className="numero mt-4 text-[15px] text-tinta-60">Carga horária: {cert.hours}</p>
          )}
        </div>

        <div className="mt-16 flex flex-col items-center gap-1 sm:mt-20">
          {cert.signer && (
            <>
              <span className="h-px w-[240px] bg-tinta" />
              <span className="mt-2 text-[14px] font-medium text-tinta">{cert.signer}</span>
            </>
          )}
        </div>

        <div className="mt-14 border-t-[1.5px] border-dashed border-tinta pt-4 text-center">
          <p className="rotulo m-0 text-tinta-60">
            Código de validação: <span className="numero text-tinta">{cert.code}</span>
          </p>
          <p className="corpo-suave m-0 mt-1">
            Confira a autenticidade em ellevaeventos.com.br/certificado/{cert.code}
          </p>
        </div>
      </div>
    </main>
  );
}
