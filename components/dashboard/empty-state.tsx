import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 bg-[#1A2744]/6 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#1A2744]/30" />
      </div>
      <h3
        className="text-xl text-[#1A2744] mb-1"
        style={{ fontFamily: "var(--font-instrument-serif), serif" }}
      >
        {title}
      </h3>
      <p className="text-[#1A2744]/50 text-sm max-w-xs">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 bg-[#1A2744] hover:bg-[#243255] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
