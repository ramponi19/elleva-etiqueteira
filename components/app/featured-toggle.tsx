"use client";

import { useState } from "react";
import { setFeatured } from "@/lib/actions/events";

export default function FeaturedToggle({ id, initial }: { id: string; initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !checked;
    setChecked(next);
    setPending(true);
    const res = await setFeatured(id, next);
    setPending(false);
    if (!res.ok) setChecked(!next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`cat-pill`}
      style={{
        cursor: "pointer",
        border: "1px solid var(--border)",
        background: checked ? "var(--navy-800)" : "var(--bg-tint)",
        color: checked ? "var(--text-invert)" : "var(--text-tertiary)",
      }}
    >
      {checked ? "Em destaque" : "Marcar destaque"}
    </button>
  );
}
