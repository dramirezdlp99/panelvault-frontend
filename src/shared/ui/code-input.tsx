"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/cn";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Se llama cuando están todos los dígitos. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
};

/**
 * Código de verificación en casillas separadas: avanza solo al escribir,
 * retrocede con Borrar y acepta pegar el código completo.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  label = "Código de verificación",
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function update(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  }

  function handleInput(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    // Los dígitos se llenan en orden: escribir en una casilla vacía agrega al final.
    const position = Math.min(index, value.length);
    const clean = update(value.slice(0, position) + digit + value.slice(position + 1));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      // Borra el último dígito escrito y deja el foco en su casilla.
      const clean = update(value.slice(0, Math.max(0, value.length - 1)));
      refs.current[clean.length]?.focus();
    } else if (event.key === "ArrowLeft") {
      refs.current[Math.max(0, index - 1)]?.focus();
    } else if (event.key === "ArrowRight") {
      refs.current[Math.min(length - 1, index + 1)]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const clean = update(event.clipboardData.getData("text"));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  }

  return (
    <div role="group" aria-label={label} className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          className={cn(
            "size-12 rounded-[var(--radius-panel)] border-2 bg-surface text-center font-mono text-2xl font-bold sm:size-14",
            "focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none disabled:opacity-60",
            invalid ? "border-accent" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
