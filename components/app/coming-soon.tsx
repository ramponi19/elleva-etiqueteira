import Icon from "@/components/shared/icon";

export default function ComingSoon({ note }: { note: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-tertiary)" }}>
      <Icon icon="solar:hammer-bold-duotone" style={{ fontSize: 48, color: "var(--text-muted)" }} />
      <p className="body" style={{ marginTop: 14 }}>{note}</p>
    </div>
  );
}
