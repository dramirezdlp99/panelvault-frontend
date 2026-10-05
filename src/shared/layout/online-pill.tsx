"use client";

import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { cn } from "@/shared/lib/cn";

/** Indicador de conexión: en línea (verde) o sin conexión (amarillo). */
export function OnlinePill({ className }: { className?: string }) {
  const online = useOnlineStatus();
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-chip)] border-2 border-line px-2.5 py-1 font-mono text-[11px] font-bold uppercase",
        online ? "bg-surface" : "bg-highlight text-on-highlight",
        className,
      )}
    >
      <span aria-hidden className={cn("size-2 rounded-full", online ? "bg-success" : "bg-line animate-pulse")} />
      {online ? "En línea" : "Sin conexión"}
    </span>
  );
}
