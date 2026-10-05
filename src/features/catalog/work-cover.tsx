import { cn } from "@/shared/lib/cn";

export type CoverTone = "accent" | "highlight" | "ai";

const tones: Record<CoverTone, string> = {
  accent: "bg-accent text-on-accent",
  highlight: "bg-highlight text-on-highlight",
  ai: "bg-ai text-[#16161a]",
};

const ORDER: CoverTone[] = ["highlight", "accent", "ai"];

/** Tono estable a partir del slug: la misma obra siempre tiene el mismo color. */
export function toneFor(slug: string): CoverTone {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ORDER[hash % ORDER.length];
}

type WorkCoverProps = {
  year?: number | null;
  publisher?: string | null;
  tone: CoverTone;
  /** Formato vertical (3:4) para la ficha; horizontal (4:3) en las tarjetas. */
  tall?: boolean;
  className?: string;
};

/**
 * Portada tipográfica: en lugar de usar imágenes de terceros, cada obra se presenta
 * como la cabecera de un periódico de su época, con el año en grande.
 */
export function WorkCover({ year, publisher, tone, tall = false, className }: WorkCoverProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex flex-col justify-between overflow-hidden border-b-2 border-line p-5",
        tall ? "aspect-[3/4]" : "aspect-[4/3]",
        tones[tone],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(currentColor_1.2px,transparent_1.2px)] [background-size:10px_10px]" />
      <span className="relative border-b-2 border-current pb-1 font-mono text-xs font-bold uppercase tracking-[0.2em]">
        {publisher ?? "Archivo PanelVault"}
      </span>
      <span className="relative font-display text-7xl font-extrabold leading-none tracking-tighter">{year ?? "—"}</span>
    </div>
  );
}
