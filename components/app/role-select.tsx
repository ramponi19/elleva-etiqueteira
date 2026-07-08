"use client";

import { useState, useTransition } from "react";
import { setUserRole, type Role } from "@/lib/actions/admin";

export default function RoleSelect({
  userId,
  current,
}: {
  userId: string;
  current: Role;
}) {
  const [role, setRole] = useState<Role>(current);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Role;
    setRole(next);
    startTransition(async () => {
      const res = await setUserRole(userId, next);
      if (!res.ok) setRole(current);
    });
  }

  return (
    <select
      value={role}
      onChange={onChange}
      disabled={pending}
      className="rounded-full border-[1.5px] border-tinta bg-white px-3 py-1.5 text-[13px] text-tinta outline-none focus:border-sol disabled:opacity-60"
    >
      <option value="customer">Cliente</option>
      <option value="producer">Produtor</option>
      <option value="admin">Admin</option>
    </select>
  );
}
