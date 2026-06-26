import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#1A2744]/8 flex items-center justify-between px-6 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1
          className="text-lg text-[#1A2744] leading-none"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[#1A2744]/40 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-[#1A2744]/40 hover:text-[#1A2744] hover:bg-[#1A2744]/5 transition-all">
          <Search size={16} />
        </button>
        <button className="p-2 rounded-lg text-[#1A2744]/40 hover:text-[#1A2744] hover:bg-[#1A2744]/5 transition-all relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C9A96E] rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#1A2744] flex items-center justify-center text-white text-xs font-semibold ml-1">
          U
        </div>
      </div>
    </header>
  );
}
