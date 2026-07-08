"use client";

import { useState } from "react";
import { clsx } from "clsx";
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
      className={clsx(
        "rotulo cursor-pointer rounded-full border-[1.5px] border-tinta px-3 py-1.5 transition-colors disabled:opacity-60",
        checked ? "bg-tinta text-papel" : "text-tinta-60 hover:bg-papel-2"
      )}
    >
      {checked ? "Em destaque" : "Marcar destaque"}
    </button>
  );
}
