import Link from "next/link";
import { LogoElleva } from "@/components/elleva/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-papel px-5 py-12">
      <Link href="/" aria-label="Elleva Tickets — início" className="mb-8 text-tinta">
        <LogoElleva />
      </Link>
      <div className="w-full max-w-[400px]">{children}</div>
    </main>
  );
}
