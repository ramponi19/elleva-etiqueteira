import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/shared/icon";

export default async function CheckinReport() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("event_title, status");

  // agrega por evento
  const map = new Map<string, { total: number; used: number }>();
  for (const t of tickets ?? []) {
    if (t.status === "cancelled") continue;
    const cur = map.get(t.event_title) ?? { total: 0, used: 0 };
    cur.total += 1;
    if (t.status === "used") cur.used += 1;
    map.set(t.event_title, cur);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].total - a[1].total);

  if (!rows.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)" }}>
        <Icon icon="solar:clipboard-list-bold-duotone" style={{ fontSize: 44, color: "var(--text-muted)" }} />
        <p className="body" style={{ marginTop: 12 }}>Nenhum ingresso emitido ainda.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
      {rows.map(([title, c], i) => {
        const pct = c.total ? Math.round((c.used / c.total) * 100) : 0;
        return (
          <div key={title} style={{ padding: "16px 20px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</p>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>
                {c.used}/{c.total} ({pct}%)
              </span>
            </div>
            <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold-500)" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
              <span>Emitidos: <strong style={{ color: "var(--text-primary)" }}>{c.total}</strong></span>
              <span>Validados: <strong style={{ color: "var(--text-primary)" }}>{c.used}</strong></span>
              <span>Restantes: <strong style={{ color: "var(--text-primary)" }}>{c.total - c.used}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
