import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("explica que la pagina no existe y ofrece volver al inicio", () => {
    render(<NotFound />);
    expect(screen.getByText("Esta página no existe")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });
});
