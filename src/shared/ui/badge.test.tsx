import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("usa el amarillo editorial por defecto", () => {
    render(<Badge>Dominio público</Badge>);
    expect(screen.getByText("Dominio público").className).toContain("bg-highlight");
  });

  it("usa el cian reservado a la IA en el tono ai", () => {
    render(<Badge tone="ai">IA</Badge>);
    const badge = screen.getByText("IA");
    expect(badge.className).toContain("text-ai-ink");
    expect(badge.className).toContain("border-ai");
  });
});
