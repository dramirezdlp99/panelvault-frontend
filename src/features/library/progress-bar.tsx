import { cn } from "@/shared/lib/cn";

/** Barra de progreso de lectura; verde al terminar. */
export function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  const done = percent >= 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-2.5 overflow-hidden rounded-full border-2 border-line bg-surface-muted", className)}
    >
      <div className={cn("h-full", done ? "bg-success" : "bg-accent")} style={{ width: `${percent}%` }} />
    </div>
  );
}
