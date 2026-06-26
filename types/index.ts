import type { Database } from "./database";

export type { Database, Json } from "./database";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Organization = Row<"organizations">;
export type Profile = Row<"profiles">;
export type LabelTemplate = Row<"label_templates">;
export type PrintJob = Row<"print_jobs">;

// ip_address vem como `unknown` (tipo inet do Postgres) — tratamos como string no app
export type Printer = Omit<Row<"printers">, "ip_address"> & {
  ip_address: string | null;
};

// Mantém unions literais para role/status (geradas como `string` pelo Supabase)
export type Invitation = Omit<Row<"invitations">, "role" | "status"> & {
  role: "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "expired" | "revoked";
};
