import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./logo";

describe("Logo", () => {
  it("enlaza al inicio con un nombre accesible", () => {
    render(<Logo />);
    expect(screen.getByRole("link", { name: "PanelVault, ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("permite otro destino", () => {
    render(<Logo href="/biblioteca" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/biblioteca");
  });
});
