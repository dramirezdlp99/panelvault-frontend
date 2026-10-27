import { describe, expect, it } from "vitest";

import { addEntries, breakdown, computeInp, rate, type Interaction } from "./inp";

const make = (id: number, duration: number): Interaction => ({ id, name: "click", duration, inputDelay: 0, processing: 0, presentation: 0, at: id });

describe("INP", () => {
  it("clasifica con los umbrales de Google", () => {
    expect(rate(120)).toBe("good");
    expect(rate(200)).toBe("needs-improvement");
    expect(rate(500)).toBe("needs-improvement");
    expect(rate(501)).toBe("poor");
  });

  it("descompone en espera, procesamiento y presentacion", () => {
    const parts = breakdown({ name: "click", startTime: 100, processingStart: 130, processingEnd: 180, duration: 120 });
    expect(parts).toMatchObject({ inputDelay: 30, processing: 50, presentation: 40 });
    expect(parts.inputDelay + parts.processing + parts.presentation).toBe(parts.duration);
  });

  it("con pocas interacciones el INP es la peor", () => {
    expect(computeInp([make(1, 40), make(2, 180), make(3, 90)])).toBe(180);
  });

  it("ignora un valor atipico por cada 50 interacciones", () => {
    const many = Array.from({ length: 60 }, (_, i) => make(i + 1, 50));
    many[0] = make(1, 900);
    expect(computeInp(many)).toBe(50);
  });

  it("agrupa los eventos de una misma interaccion y conserva el mas lento", () => {
    const map = addEntries(new Map(), [
      { name: "pointerdown", startTime: 0, processingStart: 1, processingEnd: 2, duration: 24, interactionId: 7 },
      { name: "click", startTime: 0, processingStart: 5, processingEnd: 60, duration: 80, interactionId: 7 },
      { name: "mousemove", startTime: 0, processingStart: 1, processingEnd: 2, duration: 30 },
    ], 1);
    expect(map.size).toBe(1);
    expect(map.get(7)?.duration).toBe(80);
  });

  it("sin interacciones no hay INP", () => {
    expect(computeInp([])).toBeNull();
  });
});
