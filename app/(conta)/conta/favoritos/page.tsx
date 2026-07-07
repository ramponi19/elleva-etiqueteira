import type { Metadata } from "next";
import PageHeader from "@/components/app/page-header";
import ComingSoon from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Favoritos" };

export default function ContaFavoritos() {
  return (
    <>
      <PageHeader title="Favoritos" subtitle="Eventos que você salvou para depois." />
      <main style={{ padding: 32 }}>
        <ComingSoon note="Salvar eventos favoritos em breve." />
      </main>
    </>
  );
}
