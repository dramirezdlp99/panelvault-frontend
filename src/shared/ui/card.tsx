import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

type CardProps = ComponentProps<"div"> & {
  /** "ai" usa el borde y la sombra cian reservados a lo que produce la IA. */
  tone?: "default" | "ai";
  /** Agrega el efecto de presionar al pasar el cursor (para tarjetas clicables). */
  interactive?: boolean;
};

/** Contenedor base del diseño: una "viñeta" con borde de tinta y sombra sólida. */
export function Card({ tone = "default", interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border-2 bg-surface",
        tone === "ai" ? "border-ai shadow-hard-ai" : "border-line shadow-hard",
        interactive && "press",
        className,
      )}
      {...props}
    />
  );
}
