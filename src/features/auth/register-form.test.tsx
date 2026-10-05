import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter, router } from "@/test/router";

import { RegisterForm } from "./register-form";

vi.mock("next/navigation", () => nextNavigationMock());

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetRouter();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function fillForm(values: { name?: string; email?: string; password?: string; confirm?: string }) {
  const user = userEvent.setup();
  if (values.name) await user.type(screen.getByLabelText("Nombre"), values.name);
  if (values.email) await user.type(screen.getByLabelText("Correo electrónico"), values.email);
  if (values.password) await user.type(screen.getByLabelText("Contraseña", { selector: "input" }), values.password);
  if (values.confirm) await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), values.confirm);
  await user.click(screen.getByRole("button", { name: /crear cuenta/i }));
}

describe("RegisterForm", () => {
  it("valida todos los campos antes de enviar", async () => {
    render(<RegisterForm />);
    await fillForm({ name: "A", email: "x", password: "corta", confirm: "otra" });
    expect(screen.getByText(/El nombre debe tener/)).toBeInTheDocument();
    expect(screen.getByText("El correo no tiene un formato válido.")).toBeInTheDocument();
    expect(screen.getByText(/Mínimo 10 caracteres/)).toBeInTheDocument();
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("crea la cuenta, inicia sesion y va a la biblioteca", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "u" }, 201))
      .mockResolvedValueOnce(jsonResponse({ status: "AUTHENTICATED", user: null }));
    render(<RegisterForm />);
    await fillForm({ name: "Ana", email: "ana@example.com", password: "clave segura 2026", confirm: "clave segura 2026" });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["/api/auth/register", "/api/auth/login"]);
    expect(router.replace).toHaveBeenCalledWith("/biblioteca");
  });

  it("muestra el correo duplicado junto al campo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 409, code: "user.email_taken", message: "x" }, 409));
    render(<RegisterForm />);
    await fillForm({ name: "Ana", email: "ana@example.com", password: "clave segura 2026", confirm: "clave segura 2026" });
    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
  });

  it("muestra el medidor de fuerza de la contrasena", async () => {
    render(<RegisterForm />);
    await userEvent.setup().type(screen.getByLabelText("Contraseña", { selector: "input" }), "Clave-Segura-2026");
    expect(screen.getByText("Excelente")).toBeInTheDocument();
  });
});
