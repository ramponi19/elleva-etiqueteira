import { cn } from "@/lib/utils";

type Status =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "online"
  | "offline"
  | "error"
  | "busy";

const MAP: Record<Status, { label: string; cls: string }> = {
  queued: { label: "Na fila", cls: "bg-blue-50 text-blue-600" },
  processing: { label: "Processando", cls: "bg-amber-50 text-amber-600" },
  completed: { label: "Concluído", cls: "bg-green-50 text-green-600" },
  failed: { label: "Falhou", cls: "bg-red-50 text-red-600" },
  cancelled: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
  online: { label: "Online", cls: "bg-green-50 text-green-600" },
  offline: { label: "Offline", cls: "bg-gray-100 text-gray-500" },
  error: { label: "Erro", cls: "bg-red-50 text-red-600" },
  busy: { label: "Ocupada", cls: "bg-amber-50 text-amber-600" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, cls } = MAP[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", cls)}>
      {label}
    </span>
  );
}
