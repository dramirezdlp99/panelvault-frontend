import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PanelPagePreview, previewPanels } from "./panel-page-preview";

describe("PanelPagePreview", () => {
  it("describe la ilustracion para lectores de pantalla", () => {
    render(<PanelPagePreview />);
    expect(
      screen.getByRole("img", { name: /cinco viñetas detectadas y numeradas en orden de lectura/i }),
    ).toBeInTheDocument();
  });

  it("dibuja las cinco vinetas numeradas del 1 al 5", () => {
    render(<PanelPagePreview />);
    const panels = screen.getAllByTestId("preview-panel");
    expect(panels).toHaveLength(5);
    panels.forEach((panel, index) => expect(panel).toHaveTextContent(String(index + 1)));
  });

  it("las vinetas siguen el orden occidental: de arriba abajo y de izquierda a derecha", () => {
    for (let i = 1; i < previewPanels.length; i++) {
      const prev = previewPanels[i - 1];
      const current = previewPanels[i];
      const sameRow = current.y === prev.y;
      expect(sameRow ? current.x > prev.x : current.y > prev.y).toBe(true);
    }
  });

  it("ninguna vineta se sale de la pagina ni se superpone con otra", () => {
    for (const a of previewPanels) {
      expect(a.x + a.w).toBeLessThanOrEqual(400);
      expect(a.y + a.h).toBeLessThanOrEqual(520);
      for (const b of previewPanels) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
    }
  });

  it("indica cuantas vinetas se detectaron", () => {
    render(<PanelPagePreview />);
    expect(screen.getByText("5 viñetas detectadas")).toBeInTheDocument();
  });
});
