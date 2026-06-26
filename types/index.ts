import type { Database } from "./database";

export type { Database, Json } from "./database";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type EventRow = Row<"events">;
export type TicketTier = Row<"ticket_tiers">;
export type Order = Row<"orders">;
export type OrderItem = Row<"order_items">;
export type Profile = Row<"profiles">;
