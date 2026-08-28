import "./auth.css";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eau">
      <div className="amb" aria-hidden />
      <Link href="/" aria-label="Elleva Tickets — início" className="brand">
        <img src="/logo-elleva.png" alt="Elleva Tickets" />
      </Link>
      <div className="box">{children}</div>
    </div>
  );
}
