/**
 * Demostración del Event Loop: programa trabajo de cada tipo y registra el orden REAL en que
 * se ejecutó. La regla: primero todo el código síncrono, luego TODAS las microtasks
 * (promesas, queueMicrotask) y recién después la siguiente task (setTimeout).
 */
export type LoopStep = { label: string; kind: "sync" | "microtask" | "task" | "frame"; at: number };

export function runEventLoopDemo(now: () => number = () => performance.now()): Promise<LoopStep[]> {
  const steps: LoopStep[] = [];
  const start = now();
  const log = (label: string, kind: LoopStep["kind"]) => steps.push({ label, kind, at: now() - start });

  return new Promise((resolve) => {
    log("Código síncrono: inicio", "sync");
    setTimeout(() => log("Task: setTimeout(0)", "task"), 0);
    Promise.resolve().then(() => log("Microtask: Promise.then", "microtask"));
    queueMicrotask(() => log("Microtask: queueMicrotask", "microtask"));
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => log("Frame: requestAnimationFrame (antes de pintar)", "frame"));
    }
    log("Código síncrono: fin", "sync");
    setTimeout(() => resolve(steps), 120);
  });
}

/** Ocupa el hilo principal sin soltarlo. Sale antes si `shouldStop` devuelve true. */
export function busyBlock(maxMs: number, shouldStop: () => boolean = () => false): number {
  const start = performance.now();
  while (performance.now() - start < maxMs && !shouldStop()) {
    // Bucle vacío a propósito: así se ve qué pasa cuando el hilo principal no responde.
  }
  return performance.now() - start;
}
