/**
 * INP (Interaction to Next Paint): qué tan rápido responde la interfaz a CADA interacción.
 *
 *   INP de una interacción = Input Delay + Processing + Presentation Delay
 *
 * - Input Delay: espera en la cola porque el hilo principal estaba ocupado.
 * - Processing: tiempo de los manejadores de eventos (nuestro JavaScript).
 * - Presentation Delay: estilos, layout, paint y composición hasta el siguiente frame.
 *
 * El INP de la sesión es la peor interacción, ignorando una de cada 50 (percentil ~98),
 * igual que la métrica oficial de Google. Umbrales: bueno < 200 ms, pobre > 500 ms.
 */

export type InpRating = "good" | "needs-improvement" | "poor";

export type Interaction = {
  id: number;
  name: string;
  duration: number;
  inputDelay: number;
  processing: number;
  presentation: number;
  at: number;
};

/** Lo mínimo de un PerformanceEventTiming que necesitamos (facilita las pruebas). */
export type EventTimingLike = {
  name: string;
  startTime: number;
  duration: number;
  processingStart: number;
  processingEnd: number;
  interactionId?: number;
};

export const GOOD_MS = 200;
export const POOR_MS = 500;

export function rate(ms: number): InpRating {
  if (ms < GOOD_MS) return "good";
  if (ms <= POOR_MS) return "needs-improvement";
  return "poor";
}

/** Descompone una entrada del navegador en sus tres partes. */
export function breakdown(entry: EventTimingLike): Omit<Interaction, "id" | "at"> {
  const inputDelay = Math.max(0, entry.processingStart - entry.startTime);
  const processing = Math.max(0, entry.processingEnd - entry.processingStart);
  const presentation = Math.max(0, entry.startTime + entry.duration - entry.processingEnd);
  return { name: entry.name, duration: entry.duration, inputDelay, processing, presentation };
}

/** INP de la sesión: la interacción más lenta, descartando una por cada 50 interacciones. */
export function computeInp(interactions: Interaction[]): number | null {
  if (interactions.length === 0) return null;
  const sorted = [...interactions].sort((a, b) => b.duration - a.duration);
  const skip = Math.min(Math.floor(interactions.length / 50), sorted.length - 1);
  return sorted[skip].duration;
}

/**
 * Agrupa las entradas por interacción (un clic produce varios eventos: pointerdown, pointerup,
 * click) y se queda con la más lenta de cada grupo.
 */
export function addEntries(current: Map<number, Interaction>, entries: EventTimingLike[], now: number): Map<number, Interaction> {
  const next = new Map(current);
  for (const entry of entries) {
    if (!entry.interactionId) continue;
    const previous = next.get(entry.interactionId);
    if (previous && previous.duration >= entry.duration) continue;
    next.set(entry.interactionId, { id: entry.interactionId, at: now, ...breakdown(entry) });
  }
  return next;
}

type Listener = (state: { inp: number | null; interactions: Interaction[] }) => void;

/** Observa las interacciones reales del usuario con PerformanceObserver. */
export class InpMonitor {
  private interactions = new Map<number, Interaction>();
  private readonly listeners = new Set<Listener>();
  private observer: PerformanceObserver | null = null;

  start(): boolean {
    if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes?.includes("event")) return false;
    this.observer = new PerformanceObserver((list) => {
      this.interactions = addEntries(this.interactions, list.getEntries() as unknown as EventTimingLike[], performance.now());
      this.emit();
    });
    this.observer.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    return true;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  /** Empieza una medición nueva (útil después de las demostraciones de bloqueo). */
  reset(): void {
    this.interactions = new Map();
    this.emit();
  }

  stop(): void {
    this.observer?.disconnect();
    this.listeners.clear();
  }

  private snapshot() {
    const interactions = [...this.interactions.values()].sort((a, b) => b.at - a.at);
    return { inp: computeInp(interactions), interactions };
  }

  private emit() {
    const state = this.snapshot();
    this.listeners.forEach((l) => l(state));
  }
}

let shared: InpMonitor | null = null;

/** Un solo monitor por pestaña, compartido por el indicador y el laboratorio. */
export function getInpMonitor(): InpMonitor {
  if (!shared) {
    shared = new InpMonitor();
    shared.start();
  }
  return shared;
}
