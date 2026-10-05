"use client";

import { TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  /** Si se pasa, el botón de confirmar se habilita solo tras marcar la casilla. */
  acknowledgement?: string;
  acknowledged?: boolean;
  onAcknowledgedChange?: (value: boolean) => void;
};

/** Diálogo de confirmación para acciones irreversibles (Escape cancela). */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, children, confirmLabel, onConfirm, onCancel, pending, acknowledgement, acknowledged, onAcknowledgedChange } = props;
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-lg overflow-hidden rounded-[var(--radius-panel)] border-[3px] border-line bg-surface shadow-hard-lg">
        <div className="flex items-center justify-between border-b-2 border-line bg-highlight px-5 py-2 text-on-highlight">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase">
            <TriangleAlert aria-hidden className="size-4" />
            Acción irreversible
          </span>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="rounded border-2 border-line bg-surface p-0.5 text-ink">
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-5 p-6">
          <h2 id={titleId} className="font-display text-2xl font-extrabold uppercase leading-tight">
            {title}
          </h2>
          <div className="text-ink-muted">{children}</div>
          {acknowledgement ? (
            <label className="flex items-center gap-3 rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted p-3 text-sm font-semibold">
              <input type="checkbox" checked={Boolean(acknowledged)} onChange={(e) => onAcknowledgedChange?.(e.target.checked)} className="size-5 accent-[var(--pv-accent)]" />
              {acknowledgement}
            </label>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={pending || (acknowledgement ? !acknowledged : false)}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
