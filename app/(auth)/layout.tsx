import "./auth.css";
import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eau">
      <div className="amb" aria-hidden />
      <Link href="/" aria-label="Elleva Tickets — início" className="brand">
        <LogoElleva />
      </Link>
      <div className="box">{children}</div>
    </div>
  );
}
