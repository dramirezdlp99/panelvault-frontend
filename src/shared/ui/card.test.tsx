import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./card";

describe("Card", () => {
  it("dibuja borde de tinta y sombra solida", () => {
    render(<Card>contenido</Card>);
    const card = screen.getByText("contenido");
    expect(card.className).toContain("border-line");
    expect(card.className).toContain("shadow-hard");
    expect(card.className).not.toContain("press");
  });

  it("usa borde y sombra cian en el tono ai", () => {
    render(<Card tone="ai">ia</Card>);
    expect(screen.getByText("ia").className).toContain("shadow-hard-ai");
  });

  it("agrega el efecto de presion cuando es interactiva", () => {
    render(<Card interactive>clic</Card>);
    expect(screen.getByText("clic").className).toContain("press");
  });
});
