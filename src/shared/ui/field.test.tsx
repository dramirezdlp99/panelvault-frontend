import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  afterEach(() => vi.restoreAllMocks());

  it("conecta la etiqueta con el control y muestra la ayuda", () => {
    render(
      <Field label="Correo" hint="Usa tu correo personal">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAccessibleDescription("Usa tu correo personal");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marca el control propio como invalido y anuncia el error", () => {
    render(
      <Field label="Correo" error="Correo no valido">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Correo no valido");
  });

  it("a un select nativo le pasa aria-invalid y no la prop invalid", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <Field label="Dirección">
        <select>
          <option>Occidental</option>
        </select>
      </Field>,
    );
    const select = screen.getByLabelText("Dirección");
    expect(select).not.toHaveAttribute("invalid");
    expect(select).not.toHaveAttribute("aria-invalid");

    rerender(
      <Field label="Dirección" error="Elige una dirección">
        <select>
          <option>Occidental</option>
        </select>
      </Field>,
    );
    expect(screen.getByLabelText("Dirección")).toHaveAttribute("aria-invalid", "true");
    expect(consoleError).not.toHaveBeenCalled();
  });
});
