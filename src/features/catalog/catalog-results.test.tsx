import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Loaded } from "@/server/catalog/catalog-data";

import type { Work } from "./types";

const loadWorks = vi.hoisted(() => vi.fn());
vi.mock("@/server/catalog/catalog-data", () => ({ loadWorks }));

const { CatalogResults, catalogHref } = await import("./catalog-results");

const work = (n: number): Work => ({
  id: `id-${n}`,
  slug: `obra-${n}`,
  title: `Obra ${n}`,
  author: "Autor",
  year: 1900 + n,
  sourceUrl: "https://x.org",
  license: "PUBLIC_DOMAIN",
  tags: ["humor"],
  published: true,
  updatedAt: "2026-01-01T00:00:00Z",
});

async function renderResults(result: Loaded<unknown>, query = "", page = 0) {
  loadWorks.mockResolvedValue(result);
  render(await CatalogResults({ query, page }));
}

describe("catalogHref", () => {
  it("arma la URL con busqueda y pagina humana (1-based)", () => {
    expect(catalogHref("", 0)).toBe("/catalogo");
    expect(catalogHref("nemo", 0)).toBe("/catalogo?q=nemo");
    expect(catalogHref("nemo", 2)).toBe("/catalogo?q=nemo&pagina=3");
  });
});

describe("CatalogResults", () => {
  it("lista las obras con enlace a su ficha", async () => {
    await renderResults({ kind: "ok", data: { items: [work(1), work(2)], page: 0, size: 12, totalItems: 2, totalPages: 1 } });
    expect(screen.getByText("2 obras disponibles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /obra 1/i })).toHaveAttribute("href", "/catalogo/obra-1");
    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();
  });

  it("pagina cuando hay mas de una pagina", async () => {
    await renderResults({ kind: "ok", data: { items: [work(1)], page: 0, size: 12, totalItems: 30, totalPages: 3 } }, "x");
    expect(screen.getByRole("link", { name: "Página siguiente" })).toHaveAttribute("href", "/catalogo?q=x&pagina=2");
  });

  it("explica cuando la busqueda no encuentra nada", async () => {
    await renderResults({ kind: "ok", data: { items: [], page: 0, size: 12, totalItems: 0, totalPages: 0 } }, "zzz");
    expect(screen.getByText("No encontramos obras para «zzz».")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todo el catálogo" })).toBeInTheDocument();
  });

  it("avisa si el servidor no esta disponible", async () => {
    await renderResults({ kind: "unavailable" });
    expect(screen.getByText("Catálogo no disponible")).toBeInTheDocument();
  });
});
