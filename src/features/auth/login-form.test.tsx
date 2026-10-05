import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter, router } from "@/test/router";

import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => nextNavigationMock());

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetRouter();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function fill(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Correo electrónico"), email);
  await user.type(screen.getByLabelText("Contraseña", { selector: "input" }), password);
  await user.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("LoginForm", () => {
  it("valida el correo sin llamar al servidor", async () => {
    render(<LoginForm />);
    await fill("no-es-correo", "clave");
    expect(await screen.findByText("El correo no tiene un formato válido.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ingresa y va al destino pedido", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "AUTHENTICATED", user: { id: "u", name: "Ana", role: "LECTOR" } }));
    render(<LoginForm next="/lector/abc" />);
    await fill("Ana@Example.com", "clave segura 1");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "ana@example.com", password: "clave segura 1" });
    expect(router.replace).toHaveBeenCalledWith("/lector/abc");
  });

  it("ignora destinos externos", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "AUTHENTICATED", user: null }));
    render(<LoginForm next="https://evil.com" />);
    await fill("ana@example.com", "clave segura 1");
    expect(router.replace).toHaveBeenCalledWith("/biblioteca");
  });

  it("pasa a la verificacion en dos pasos cuando se requiere", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "TWO_FACTOR_REQUIRED" }));
    render(<LoginForm next="/seguridad" />);
    await fill("ana@example.com", "clave segura 1");
    expect(router.push).toHaveBeenCalledWith("/ingresar/verificacion?next=%2Fseguridad");
  });

  it("muestra el error y limpia la contrasena", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, code: "auth.invalid_credentials", message: "x" }, 401));
    render(<LoginForm />);
    await fill("ana@example.com", "mala clave 1");
    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña", { selector: "input" })).toHaveValue("");
  });

  it("avisa cuanto esperar tras demasiados intentos", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 429, code: "auth.too_many_attempts", message: "x" }, 429, { "Retry-After": "720" }));
    render(<LoginForm />);
    await fill("ana@example.com", "clave segura 1");
    expect(await screen.findByText("Demasiados intentos. Intenta de nuevo en 12 minutos.")).toBeInTheDocument();
  });
});
