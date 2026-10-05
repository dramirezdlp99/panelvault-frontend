import { describe, expect, it } from "vitest";

import { fitContain, pageTransform, panelTransform, toCss } from "./panel-viewport";

const viewport = { width: 1000, height: 800 };

describe("panel-viewport", () => {
  it("ajusta la página sin deformarla", () => {
    expect(fitContain({ width: 900, height: 1350 }, viewport)).toEqual({ width: 800 * (900 / 1350), height: 800 });
    expect(fitContain({ width: 0, height: 10 }, viewport)).toEqual({ width: 0, height: 0 });
  });

  it("centra la página completa", () => {
    const base = { width: 500, height: 800 };
    expect(pageTransform(base, viewport)).toEqual({ scale: 1, x: 250, y: 0 });
  });

  it("acerca la viñeta hasta llenar el visor y la centra", () => {
    const base = { width: 500, height: 800 };
    const t = panelTransform([0, 0, 0.5, 0.25], base, viewport, 0, 10);
    // La viñeta mide 250×200 px: limita el alto (800/200 = 4) frente al ancho (1000/250 = 4).
    expect(t.scale).toBeCloseTo(4);
    // Su centro (125, 100) queda en el centro del visor (500, 400).
    expect(t.x + 125 * t.scale).toBeCloseTo(500);
    expect(t.y + 100 * t.scale).toBeCloseTo(400);
  });

  it("respeta el margen y el acercamiento máximo", () => {
    const base = { width: 500, height: 800 };
    expect(panelTransform([0.4, 0.4, 0.01, 0.01], base, viewport, 24, 4).scale).toBe(4);
    const withPadding = panelTransform([0, 0, 1, 1], base, viewport, 50, 10);
    expect(withPadding.scale).toBeCloseTo((800 - 100) / 800);
  });

  it("genera la transformación CSS", () => {
    expect(toCss({ scale: 2, x: 10.123, y: -5 })).toBe("translate(10.12px, -5.00px) scale(2.0000)");
  });
});
