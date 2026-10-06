"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

type FieldProps = {
  label: string;
  /** Texto de ayuda debajo del campo. */
  hint?: ReactNode;
  error?: string | null;
  /** Elemento junto a la etiqueta (por ejemplo, un enlace). */
  aside?: ReactNode;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; invalid?: boolean; "aria-invalid"?: boolean }>;
};

/** Etiqueta + control + ayuda/error, conectados por id para lectores de pantalla. */
export function Field({ label, hint, error, aside, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  // Los componentes propios (Input, TagInput...) reciben "invalid"; un elemento nativo
  // como <select> no conoce esa prop, así que recibe directamente "aria-invalid".
  const isNative = isValidElement(children) && typeof children.type === "string";
  const control = isValidElement(children)
    ? cloneElement(
        children,
        isNative
          ? { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined }
          : { id, "aria-describedby": describedBy, invalid: Boolean(error) },
      )
    : children;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {aside}
      </div>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
