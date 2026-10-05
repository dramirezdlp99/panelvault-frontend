import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY } from "./theme";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("parte en modo claro y ofrece activar el oscuro", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Activar modo oscuro" })).toBeInTheDocument();
  });

  it("cambia el tema, lo guarda y actualiza su etiqueta", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Activar modo oscuro" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(await screen.findByRole("button", { name: "Activar modo claro" })).toBeInTheDocument();
  });

  it("vuelve al modo claro con un segundo clic", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Activar modo oscuro" }));
    await user.click(await screen.findByRole("button", { name: "Activar modo claro" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
