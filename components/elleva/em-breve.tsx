import Icon from "@/components/shared/icon";

// Estado vazio / "em breve" no sistema Cartaz: card papel de borda tracejada
// (picote), ícone em tinta-35 e nota em corpo suave.
export function EmBreve({
  icon = "solar:hammer-bold-duotone",
  nota,
}: {
  icon?: string;
  nota: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border-[1.5px] border-dashed border-tinta bg-white py-16 text-center">
      <Icon icon={icon} style={{ fontSize: 48, color: "var(--color-tinta-35)" }} />
      <p className="corpo mt-4 text-tinta-60">{nota}</p>
    </div>
  );
}
