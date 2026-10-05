import { cn } from "@/shared/lib/cn";

import type { Classic } from "./content";

const tones: Record<Classic["tone"], string> = {
  accent: "bg-accent text-on-accent",
  highlight: "bg-highlight text-on-highlight",
  ai: "bg-ai text-[#16161a]",
};

/**
 * Portada tipográfica: en lugar de usar imágenes de terceros, cada obra se presenta
 * como la cabecera de un periódico de su época, con el año en grande.
 */
export function ClassicCover({ classic, className }: { classic: Classic; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex aspect-[4/3] flex-col justify-between overflow-hidden border-b-2 border-line p-5",
        tones[classic.tone],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(currentColor_1.2px,transparent_1.2px)] [background-size:10px_10px]" />
      <span className="relative border-b-2 border-current pb-1 font-mono text-xs font-bold uppercase tracking-[0.2em]">
        {classic.publisher}
      </span>
      <span className="relative font-display text-7xl font-extrabold leading-none tracking-tighter">{classic.year}</span>
    </div>
  );
}
