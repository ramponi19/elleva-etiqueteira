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
      if (!res.ok) setRole(current); // reverte em erro
    });
  }

  return (
    <select
      value={role}
      onChange={onChange}
      disabled={pending}
      className="input"
      style={{ width: "auto", padding: "6px 10px", fontSize: 13, borderRadius: 9999, opacity: pending ? 0.6 : 1 }}
    >
      <option value="customer">Cliente</option>
      <option value="producer">Produtor</option>
      <option value="admin">Admin</option>
    </select>
  );
}
