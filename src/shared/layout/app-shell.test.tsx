import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_EXPIRED_EVENT } from "@/shared/api/http";
import { navigation, nextNavigationMock, resetRouter, router } from "@/test/router";

import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => nextNavigationMock());

beforeEach(() => resetRouter());

const lector = { id: "u", name: "Ana Lectora", role: "LECTOR" as const };
const curador = { id: "c", name: "Carlos", role: "CURADOR" as const };

describe("AppShell", () => {
  it("marca la seccion actual", () => {
    navigation.pathname = "/biblioteca/123";
    render(<AppShell user={lector}>contenido</AppShell>);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getByRole("link", { name: "Biblioteca" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Leyendo" })).not.toHaveAttribute("aria-current");
  });

  it("oculta curaduria a los lectores y la muestra a curadores", () => {
    const { unmount } = render(<AppShell user={lector}>x</AppShell>);
    expect(screen.queryByRole("link", { name: "Curaduría" })).not.toBeInTheDocument();
    unmount();
    render(<AppShell user={curador}>x</AppShell>);
    expect(screen.getByRole("link", { name: "Curaduría" })).toHaveAttribute("href", "/curaduria");
  });

  it("la busqueda lleva a la biblioteca filtrada", async () => {
    const user = userEvent.setup();
    render(<AppShell user={lector}>x</AppShell>);
    await user.type(screen.getByRole("searchbox", { name: "Buscar en tu biblioteca" }), "nemo{Enter}");
    expect(router.push).toHaveBeenCalledWith("/biblioteca?q=nemo");
  });

  it("vuelve al ingreso cuando la sesion vence", () => {
    render(<AppShell user={lector}>x</AppShell>);
    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    });
    expect(router.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/ingresar\?next=/));
  });

  it("muestra el menu del usuario con su rol", async () => {
    const user = userEvent.setup();
    render(<AppShell user={curador}>x</AppShell>);
    await user.click(screen.getByRole("button", { name: /carlos/i }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("Curador")).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});
