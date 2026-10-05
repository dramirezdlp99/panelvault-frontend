import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonLink, buttonClasses } from "./button";

describe("Button", () => {
  it("es de tipo button por defecto para no enviar formularios por accidente", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "button");
  });

  it("respeta el tipo submit cuando se pide", () => {
    render(<Button type="submit">Entrar</Button>);
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveAttribute("type", "submit");
  });

  it("ejecuta onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clic</Button>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Clic" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("no responde cuando esta deshabilitado", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Bloqueado" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("aplica la variante principal con el color de acento y sombra solida", () => {
    const classes = buttonClasses("primary");
    expect(classes).toContain("bg-accent");
    expect(classes).toContain("shadow-hard");
  });

  it("aplica la variante secundaria y el tamano pedido", () => {
    const classes = buttonClasses("secondary", "lg");
    expect(classes).toContain("bg-surface");
    expect(classes).toContain("h-14");
  });

  it("agrega clases extra sin perder las propias", () => {
    expect(buttonClasses("ghost", "sm", "w-full")).toMatch(/h-9.*w-full/);
  });
});

describe("ButtonLink", () => {
  it("es un enlace con aspecto de boton", () => {
    render(<ButtonLink href="/registro">Crear cuenta</ButtonLink>);
    const link = screen.getByRole("link", { name: "Crear cuenta" });
    expect(link).toHaveAttribute("href", "/registro");
    expect(link.className).toContain("bg-accent");
  });
});
