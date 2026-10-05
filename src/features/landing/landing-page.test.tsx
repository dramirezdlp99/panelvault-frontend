import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { classics } from "./content";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  it("tiene un unico titulo principal con el lema", () => {
    render(<LandingPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/tu biblioteca de cómics, viñeta por viñeta/i);
  });

  it("las llamadas a la accion llevan al registro y al catalogo", () => {
    render(<LandingPage />);
    const signUps = screen.getAllByRole("link", { name: /crear cuenta gratis/i });
    expect(signUps.length).toBeGreaterThanOrEqual(2);
    signUps.forEach((link) => expect(link).toHaveAttribute("href", "/registro"));
    expect(screen.getByRole("link", { name: /explorar catálogo/i })).toHaveAttribute("href", "/catalogo");
  });

  it("explica los tres pasos en orden", () => {
    render(<LandingPage />);
    const section = screen.getByRole("region", { name: "Cómo funciona" });
    const items = within(section).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("heading").textContent)).toEqual([
      "Importa tu cómic",
      "La IA detecta las viñetas",
      "Lee viñeta por viñeta",
    ]);
  });

  it("la seccion de pasos tiene el ancla que usa el menu", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector("#como-funciona")).not.toBeNull();
  });

  it("muestra las tres ventajas", () => {
    render(<LandingPage />);
    const section = screen.getByRole("region", { name: "Por qué PanelVault" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(3);
  });

  it("enlaza cada clasico a su ficha del catalogo", () => {
    render(<LandingPage />);
    const section = screen.getByRole("region", { name: "Clásicos de dominio público" });
    for (const classic of classics) {
      const heading = within(section).getByRole("heading", { name: classic.title });
      expect(heading.closest("a")).toHaveAttribute("href", `/catalogo/${classic.slug}`);
    }
  });

  it("los clasicos coinciden con las obras publicadas por el backend", () => {
    expect(classics.map((c) => c.slug)).toEqual(["little-nemo-in-slumberland", "the-yellow-kid", "krazy-kat"]);
    expect(classics.map((c) => c.year)).toEqual([1905, 1895, 1913]);
  });
});
