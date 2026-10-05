import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Work } from "@/features/catalog/types";
import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter, router } from "@/test/router";

import { WorkForm } from "./work-form";

vi.mock("next/navigation", () => nextNavigationMock());

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetRouter();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const saved: Work = {
  id: "w-1",
  slug: "mutt-and-jeff",
  title: "Mutt and Jeff",
  author: "Bud Fisher",
  sourceUrl: "https://en.wikipedia.org/wiki/Mutt",
  license: "PUBLIC_DOMAIN",
  tags: [],
  published: false,
  updatedAt: "",
};

async function fillMinimum() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Título"), "Mutt and Jeff");
  await user.type(screen.getByLabelText("Autor"), "Bud Fisher");
  await user.type(screen.getByLabelText("URL de la fuente"), "https://en.wikipedia.org/wiki/Mutt");
  return user;
}

describe("WorkForm", () => {
  it("no envia si faltan datos obligatorios", async () => {
    const user = userEvent.setup();
    render(<WorkForm />);
    await user.click(screen.getByRole("button", { name: /guardar borrador/i }));
    expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("guarda un borrador y vuelve a la lista", async () => {
    fetchMock.mockResolvedValue(jsonResponse(saved, 201));
    render(<WorkForm />);
    const user = await fillMinimum();
    await user.click(screen.getByRole("button", { name: /guardar borrador/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/pv/curation/works");
    expect(router.push).toHaveBeenCalledWith("/curaduria");
  });

  it("publicar crea la obra y luego la publica", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(saved, 201)).mockResolvedValueOnce(jsonResponse({ ...saved, published: true }));
    render(<WorkForm />);
    const user = await fillMinimum();
    await user.type(screen.getByLabelText("Etiquetas"), "Humor{Enter}");
    await user.click(screen.getByRole("button", { name: /^publicar$/i }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tags).toEqual(["humor"]);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/pv/curation/works/w-1/publish");
  });

  it("muestra el error del backend junto al campo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 400, code: "catalog.invalid_year", message: "El ano no es valido" }, 400));
    render(<WorkForm />);
    const user = await fillMinimum();
    await user.click(screen.getByRole("button", { name: /guardar borrador/i }));
    expect(await screen.findByText("El ano no es valido")).toBeInTheDocument();
    expect(screen.getByLabelText("Año")).toHaveAttribute("aria-invalid", "true");
  });

  it("al editar una obra publicada actualiza con PUT", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...saved, published: true }));
    render(<WorkForm work={{ ...saved, published: true }} />);
    expect(screen.queryByRole("button", { name: /^publicar$/i })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /guardar cambios/i }));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/pv/curation/works/w-1");
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });
});
