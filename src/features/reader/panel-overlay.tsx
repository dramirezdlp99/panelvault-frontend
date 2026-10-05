import { cn } from "@/shared/lib/cn";

import type { DetectedPanel } from "./panel-maps";

/** Contornos cian de las viñetas detectadas, con su número de orden de lectura. */
export function PanelOverlay({ panels, current, className }: { panels: DetectedPanel[]; current?: number; className?: string }) {
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      {panels.map((panel, index) => {
        const [x, y, w, h] = panel.bbox.map((n) => n * 1000);
        const active = index === current;
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={active ? "rgb(18 164 160 / 0.18)" : "none"}
              stroke="#12a4a0"
              strokeWidth={active ? 6 : 4}
              strokeDasharray={active ? undefined : "14 10"}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Números de orden (en HTML para que no se deformen con la página). */
export function PanelNumbers({ panels, current }: { panels: DetectedPanel[]; current?: number }) {
  return (
    <>
      {panels.map((panel, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "absolute inline-flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#16161a] font-mono text-xs font-bold text-[#16161a]",
            index === current ? "bg-highlight" : "bg-ai",
          )}
          style={{ left: `${(panel.bbox[0] + 0.03) * 100}%`, top: `${(panel.bbox[1] + 0.03) * 100}%` }}
        >
          {index + 1}
        </span>
      ))}
    </>
  );
}

/** En modo guiado oscurece todo menos la viñeta actual, para que la vista se centre en ella. */
export function PanelSpotlight({ panel }: { panel: DetectedPanel }) {
  const [x, y, w, h] = panel.bbox.map((n) => n * 1000);
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
      <path
        fillRule="evenodd"
        fill="rgb(28 28 32 / 0.88)"
        d={`M-2000 -2000H3000V3000H-2000Z M${x} ${y}h${w}v${h}h${-w}Z`}
      />
    </svg>
  );
}
