import Icon from "@/components/shared/icon";

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        padding: 20,
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--bg-tint)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-gold)",
          marginBottom: 14,
        }}
      >
        <Icon icon={icon} style={{ fontSize: 22 }} />
      </div>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, margin: "2px 0 0" }}>
        {value}
      </p>
    </div>
  );
}
