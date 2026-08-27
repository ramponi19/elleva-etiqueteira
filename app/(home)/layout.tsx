import "./home.css";

// A home tem cromo próprio (nav/rodapé escuros dentro do componente),
// então NÃO usa o layout de marketing — fica isolada e não quebra as
// outras páginas.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
