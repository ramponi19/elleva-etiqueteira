export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "24px 32px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elevated)",
      }}
    >
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-.02em", margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
