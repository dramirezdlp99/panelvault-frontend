import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter, router } from "@/test/router";

import { TwoFactorForm } from "./two-factor-form";

vi.mock("next/navigation", () => nextNavigationMock());

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetRouter();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("TwoFactorForm", () => {
  it("envia solo al completar los 6 digitos y entra", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "AUTHENTICATED", user: null }));
    const user = userEvent.setup();
    render(<TwoFactorForm next="/seguridad" />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("12345");
    expect(fetchMock).not.toHaveBeenCalled();
    await user.keyboard("6");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: "123456" });
    expect(router.replace).toHaveBeenCalledWith("/seguridad");
  });

  it("permite usar un codigo de recuperacion", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "AUTHENTICATED", user: null }));
    const user = userEvent.setup();
    render(<TwoFactorForm />);
    await user.click(screen.getByRole("button", { name: "Usar un código de recuperación" }));
    await user.type(screen.getByLabelText("Código de recuperación"), "ABCDE12345");
    await user.click(screen.getByRole("button", { name: /verificar/i }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: "ABCDE12345" });
  });

  it("ofrece volver a iniciar sesion si el reto vencio", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, code: "auth.challenge_invalid", message: "x" }, 401));
    const user = userEvent.setup();
    render(<TwoFactorForm />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("123456");
    expect(await screen.findByText("La verificación expiró. Inicia sesión de nuevo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a iniciar sesión" })).toHaveAttribute("href", "/ingresar");
  });

  it("pide los 6 digitos si se envia incompleto", async () => {
    const user = userEvent.setup();
    render(<TwoFactorForm />);
    await user.click(screen.getByRole("button", { name: /verificar/i }));
    expect(screen.getByText("Escribe los 6 dígitos del código.")).toBeInTheDocument();
  });
});
