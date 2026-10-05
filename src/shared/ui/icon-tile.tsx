import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type IconTileProps = { icon: LucideIcon; tone?: "default" | "ai" | "highlight"; className?: string };

const tones = {
  default: "border-line bg-surface-muted text-ink",
  ai: "border-ai bg-paper text-ai-ink",
  highlight: "border-line bg-highlight text-on-highlight",
};

/** Ícono dentro de un cuadro con borde, usado en tarjetas de características. */
export function IconTile({ icon: Icon, tone = "default", className }: IconTileProps) {
  return (
    <span
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-[var(--radius-chip)] border-2 shadow-hard-sm",
        tones[tone],
        className,
      )}
    >
      <Icon aria-hidden className="size-5" />
    </span>
  );
}
