import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisView } from "./analysis-view";

const result = {
  engineVersion: "0.1.0",
  imageWidth: 900,
  imageHeight: 1350,
  elapsedMs: 22.2,
  stages: { normalize: 0.4, order: 0.1 },
  panelMap: {
    panels: [
      { order: 1, confidence: 0.98, bbox: [0, 0, 1, 0.5] },
      { order: 2, confidence: 0.91, bbox: [0, 0.5, 1, 0.5] },
    ],
  },
};

beforeEach(() => {
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

const image = () => new File([new Uint8Array([1, 2, 3])], "pagina.png", { type: "image/png" });

describe("AnalysisView", () => {
  it("rechaza formatos que el motor no acepta", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<AnalysisView />);
    await user.upload(screen.getByLabelText("Elegir imagen de la página"), new File(["x"], "a.gif", { type: "image/gif" }));
    expect(screen.getByText("Usa una imagen JPEG, PNG o WebP.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analizar página/i })).toBeDisabled();
  });

  it("muestra viñetas, confianza y tiempos del resultado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ pageSha256: "s", preset: "western", result }), { status: 200, headers: { "Content-Type": "application/json" } })),
    );
    const user = userEvent.setup();
    render(<AnalysisView />);
    await user.upload(screen.getByLabelText("Elegir imagen de la página"), image());
    await user.click(screen.getByRole("button", { name: "Manga (der. → izq.)" }));
    await user.click(screen.getByRole("button", { name: /analizar página/i }));

    expect(await screen.findByText("Resultado de la caché")).toBeInTheDocument();
    expect(screen.getByText("2 viñetas detectadas")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("Orden de lectura")).toBeInTheDocument();
    expect(screen.getByText("22.2 ms")).toBeInTheDocument();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe("/api/pv/analysis/pages?preset=manga");
  });

  it("muestra el error del backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ status: 400, code: "analysis.too_many_pending", message: "x" }), { status: 400, headers: { "Content-Type": "application/json" } })),
    );
    const user = userEvent.setup();
    render(<AnalysisView />);
    await user.upload(screen.getByLabelText("Elegir imagen de la página"), image());
    await user.click(screen.getByRole("button", { name: /analizar página/i }));
    expect(await screen.findByText("Tienes demasiados análisis en cola. Espera a que terminen.")).toBeInTheDocument();
  });
});
