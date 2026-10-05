import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PublicHeader } from "./public-header";

describe("PublicHeader", () => {
  it("muestra la navegacion principal", () => {
    render(<PublicHeader />);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(within(nav).getByRole("link", { name: "Cómo funciona" })).toHaveAttribute("href", "/#como-funciona");
  });

  it("enlaza a iniciar sesion y crear cuenta", () => {
    render(<PublicHeader />);
    expect(screen.getAllByRole("link", { name: "Iniciar sesión" })[0]).toHaveAttribute("href", "/ingresar");
    expect(screen.getAllByRole("link", { name: "Crear cuenta" })[0]).toHaveAttribute("href", "/registro");
  });

  it("abre y cierra el menu movil", async () => {
    const user = userEvent.setup();
    render(<PublicHeader />);
    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("menu-movil")).not.toBeVisible();

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("menu-movil")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(document.getElementById("menu-movil")).not.toBeVisible();
  });

  it("cierra el menu movil al elegir un enlace", async () => {
    const user = userEvent.setup();
    render(<PublicHeader />);
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    const mobileNav = screen.getByRole("navigation", { name: "Principal móvil" });
    // jsdom no navega entre documentos: se cancela la navegación real del enlace.
    document.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await user.click(within(mobileNav).getByRole("link", { name: "Catálogo" }));
    expect(document.getElementById("menu-movil")).not.toBeVisible();
  });
});
