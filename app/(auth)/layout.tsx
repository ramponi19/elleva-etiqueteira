import "./auth.css";
import Link from "next/link";
import { EllevaLogo } from "@/components/brand/EllevaLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eau">
      <div className="amb" aria-hidden />
      <Link href="/" aria-label="Elleva Tickets — início" className="brand">
        <EllevaLogo variant="horizontal" tone="negativo" className="h-6 w-auto sm:h-8" />
      </Link>
      <div className="box">{children}</div>
    </div>
  );
}
