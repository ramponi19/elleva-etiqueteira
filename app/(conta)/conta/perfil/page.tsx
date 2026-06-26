import PageHeader from "@/components/app/page-header";
import ComingSoon from "@/components/app/coming-soon";

export default function ContaPerfil() {
  return (
    <>
      <PageHeader title="Perfil" subtitle="Seus dados e preferências." />
      <main style={{ padding: 32 }}>
        <ComingSoon note="Edição de perfil em breve." />
      </main>
    </>
  );
}
