import { cn } from "@/shared/lib/cn";

type PanelBox = { x: number; y: number; w: number; h: number };

/** Viñetas del ejemplo, ya en orden de lectura occidental (izquierda a derecha, arriba abajo). */
export const previewPanels: PanelBox[] = [
  { x: 20, y: 20, w: 360, h: 150 },
  { x: 20, y: 186, w: 170, h: 150 },
  { x: 206, y: 186, w: 174, h: 150 },
  { x: 20, y: 352, w: 140, h: 148 },
  { x: 176, y: 352, w: 204, h: 148 },
];

const CYCLE_SECONDS = 10;

/** Dibujos simples dentro de cada viñeta (formas geométricas, sin personajes reales). */
function PanelArt({ index, box }: { index: number; box: PanelBox }) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  switch (index) {
    case 0:
      return (
        <g className="stroke-line" strokeWidth="3" fill="none" strokeLinejoin="round">
          <path d={`M${box.x + 40} ${box.y + 120} l70 -60 l40 34 l50 -52 l80 78`} />
          <circle cx={box.x + 300} cy={box.y + 45} r="16" className="fill-highlight" />
        </g>
      );
    case 1:
      return (
        <g className="stroke-line" strokeWidth="3">
          <circle cx={cx} cy={cy + 8} r="34" className="fill-surface-muted" />
          <path d={`M${cx - 14} ${cy + 18} q14 12 28 0`} fill="none" />
          <circle cx={cx - 12} cy={cy} r="3" className="fill-line" />
          <circle cx={cx + 12} cy={cy} r="3" className="fill-line" />
        </g>
      );
    case 2:
      return (
        <g className="stroke-line" strokeWidth="3">
          <rect x={box.x + 24} y={box.y + 28} width="126" height="54" rx="27" className="fill-surface" />
          <path d={`M${box.x + 60} ${box.y + 80} l-10 24 l30 -22`} className="fill-surface" />
          <path d={`M${box.x + 48} ${box.y + 55} h78`} strokeLinecap="round" />
        </g>
      );
    case 3:
      return (
        <g className="stroke-line" strokeWidth="3">
          <rect x={cx - 26} y={box.y + 34} width="52" height="96" className="fill-line" />
          <rect x={cx - 14} y={box.y + 50} width="10" height="12" className="fill-highlight" />
          <rect x={cx + 4} y={box.y + 74} width="10" height="12" className="fill-highlight" />
        </g>
      );
    default:
      return (
        <g className="stroke-line" strokeWidth="3">
          <rect x={box.x + 120} y={box.y + 60} width="56" height="56" className="fill-highlight" />
          <text
            x={box.x + 148}
            y={box.y + 94}
            textAnchor="middle"
            className="fill-line font-mono text-[13px] font-bold"
            stroke="none"
          >
            FIN
          </text>
          <path d={`M${box.x + 30} ${box.y + 116} h70`} strokeLinecap="round" />
        </g>
      );
  }
}

/**
 * Ilustración de la portada: una página con sus viñetas detectadas (contorno cian)
 * y el número de orden de lectura. Una a una se iluminan para mostrar el recorrido.
 */
export function PanelPagePreview({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div className="rotate-[1.5deg] rounded-[var(--radius-panel)] border-[3px] border-line bg-surface p-3 shadow-hard-lg">
        <svg viewBox="0 0 400 520" role="img" aria-labelledby="preview-title" className="h-auto w-full">
          <title id="preview-title">
            Página de cómic con cinco viñetas detectadas y numeradas en orden de lectura
          </title>
          {previewPanels.map((box, index) => (
            <g key={index} data-testid="preview-panel">
              <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" className="fill-surface stroke-line" strokeWidth="3" />
              <PanelArt index={index} box={box} />
              <rect
                x={box.x + 6}
                y={box.y + 6}
                width={box.w - 12}
                height={box.h - 12}
                rx="3"
                className="fill-ai stroke-ai"
                fillOpacity="0"
                strokeWidth="2.5"
                strokeDasharray="7 5"
                style={{
                  animation: `pv-panel-focus ${CYCLE_SECONDS}s linear infinite`,
                  animationDelay: `${(index * CYCLE_SECONDS) / previewPanels.length}s`,
                }}
              />
              <circle cx={box.x + 22} cy={box.y + 22} r="13" className="fill-ai stroke-line" strokeWidth="2" />
              <text
                x={box.x + 22}
                y={box.y + 27}
                textAnchor="middle"
                className="fill-[#16161a] font-mono text-[14px] font-bold"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="mt-2 flex items-center justify-between border-t-2 border-dashed border-line/30 pt-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ai-ink">
          <span>{previewPanels.length} viñetas detectadas</span>
          <span>Orden occidental</span>
        </figcaption>
      </div>
    </figure>
  );
}
