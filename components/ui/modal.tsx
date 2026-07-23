"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";

// Modal base do design system Cartaz de Show (papel/tinta/sol).
// Overlay tinta translúcido, card papel com sombra dura, fecha no Esc / clique-fora,
// trava o scroll do body. Usado por ConfirmDialog e PromptDialog.
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 420,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(20_18_16/0.55)] p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-papel p-6 shadow-[4px_4px_0_var(--color-tinta)]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-[8px] text-tinta-60 hover:bg-papel-2 hover:text-tinta"
        >
          <Icon icon="lucide:x" style={{ fontSize: 20 }} />
        </button>
        {title && <h2 className="m-0 mb-1 pr-8 text-[18px] font-extrabold text-tinta">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/** Confirmação (substitui window.confirm). Controlado por `open`. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="corpo-suave m-0 mt-1">{message}</p>}
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variante="contorno" onClick={onClose} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          variante={danger ? "primario" : "tinta"}
          onClick={onConfirm}
          disabled={pending}
          className={danger ? "!bg-sol-escuro !text-papel" : undefined}
        >
          {pending ? "Aguarde..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/** Entrada de texto (substitui window.prompt). Valida antes de confirmar. */
export function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  message,
  label,
  placeholder,
  defaultValue = "",
  inputMode,
  confirmLabel = "Salvar",
  validate,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: React.ReactNode;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputMode?: "text" | "numeric" | "email";
  confirmLabel?: string;
  /** retorna string de erro se inválido, ou null se ok */
  validate?: (value: string) => string | null;
  pending?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [err, setErr] = useState<string | null>(null);

  // ressincroniza o valor quando (re)abre com outro default
  useEffect(() => {
    if (open) {
      // reset do campo ao (re)abrir com outro default é intencional
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(defaultValue);
      setErr(null);
    }
  }, [open, defaultValue]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const problem = validate?.(v) ?? null;
    if (problem) return setErr(problem);
    onSubmit(v);
  }

  const inputCls =
    "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-3 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="corpo-suave m-0 mb-3 mt-1">{message}</p>}
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
        {label && <label className="text-[11px] font-semibold uppercase tracking-wide text-tinta-60">{label}</label>}
        <input
          className={inputCls}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode === "email" ? "email" : inputMode}
          type={inputMode === "email" ? "email" : "text"}
          autoFocus
        />
        {err && <p className="m-0 text-[13px] text-sol-escuro">{err}</p>}
        <div className="mt-3 flex justify-end gap-2.5">
          <Button variante="contorno" type="button" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variante="tinta" type="submit" disabled={pending}>
            {pending ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
