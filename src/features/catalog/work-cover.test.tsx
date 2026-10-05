import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { toneFor, WorkCover } from "./work-cover";

describe("WorkCover", () => {
  it("asigna siempre el mismo tono a la misma obra", () => {
    expect(toneFor("krazy-kat")).toBe(toneFor("krazy-kat"));
    expect(new Set(["a", "b", "c", "d", "e", "f"].map(toneFor)).size).toBeGreaterThan(1);
  });

  it("muestra el ano y la editorial, y es decorativa para lectores de pantalla", () => {
    const { container } = render(<WorkCover year={1905} publisher="New York Herald" tone="highlight" />);
    const cover = container.firstElementChild!;
    expect(cover).toHaveAttribute("aria-hidden", "true");
    expect(cover).toHaveTextContent("1905");
    expect(cover).toHaveTextContent("New York Herald");
    expect(cover.className).toContain("aspect-[4/3]");
  });

  it("usa formato vertical en la ficha", () => {
    const { container } = render(<WorkCover tone="ai" tall />);
    expect(container.firstElementChild!.className).toContain("aspect-[3/4]");
    expect(container.firstElementChild).toHaveTextContent("Archivo PanelVault");
  });
});
