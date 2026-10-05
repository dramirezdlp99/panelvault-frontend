import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

export type BadgeTone = "highlight" | "ai" | "neutral" | "accent" | "success";

const tones: Record<BadgeTone, string> = {
  highlight: "border-line bg-highlight text-on-highlight",
  ai: "border-ai bg-paper text-ai-ink",
  neutral: "border-line bg-surface text-ink",
  accent: "border-line bg-accent text-on-accent",
  success: "border-success bg-surface text-success",
};

type BadgeProps = ComponentProps<"span"> & { tone?: BadgeTone };

/** Etiqueta corta en mayúsculas y monoespaciada: formatos, estados y licencias. */
export function Badge({ tone = "highlight", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-chip)] border-[1.5px] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
