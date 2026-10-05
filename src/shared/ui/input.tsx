import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

/** Campo de texto con borde de tinta; al enfocarse muestra la sombra bermellón del diseño. */
export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full rounded-[var(--radius-panel)] border-2 bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70",
        "transition-shadow focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none",
        invalid ? "border-accent" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ invalid, className, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-28 w-full rounded-[var(--radius-panel)] border-2 bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted/70",
        "transition-shadow focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none",
        invalid ? "border-accent" : "border-line",
        className,
      )}
      {...props}
    />
  );
}
