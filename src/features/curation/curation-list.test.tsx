import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Work } from "@/features/catalog/types";
import { jsonResponse } from "@/test/jwt";

import { CurationList } from "./curation-list";

const base = { author: "Autor", sourceUrl: "https://x.org", license: "PUBLIC_DOMAIN" as const, tags: [], updatedAt: "" };
let works: Work[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  works = [
    { ...base, id: "a", slug: "a", title: "Publicada", published: true },
    { ...base, id: "b", slug: "b", title: "Borrador", published: false },
  ];
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (url.startsWith("/api/pv/curation/works?")) {
      return jsonResponse({ items: works, page: 0, size: 20, totalItems: works.length, totalPages: 1 });
    }
    const [, id, action] = url.replace("/api/pv/curation/works/", "/").split("/");
    const work = works.find((w) => w.id === id)!;
    if (action === "publish") return jsonResponse({ ...work, published: true });
    if (action === "unpublish") return jsonResponse({ ...work, published: false });
    if (method === "DELETE") {
      works = works.filter((w) => w.id !== id);
      return new Response(null, { status: 204 });
    }
    return jsonResponse({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("CurationList", () => {
  it("muestra el estado de cada obra", async () => {
    render(<CurationList />);
    const row = (await screen.findByRole("rowheader", { name: "Borrador" })).closest("tr")!;
    expect(within(row).getByText("Borrador", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar Publicada" })).toHaveAttribute("href", "/curaduria/a");
  });

  it("publica un borrador sin recargar la lista", async () => {
    const user = userEvent.setup();
    render(<CurationList />);
    await user.click(await screen.findByRole("button", { name: "Publicar Borrador" }));
    expect(await screen.findByRole("button", { name: "Despublicar Borrador" })).toBeInTheDocument();
  });

  it("eliminar pide confirmacion explicita", async () => {
    const user = userEvent.setup();
    render(<CurationList />);
    await user.click(await screen.findByRole("button", { name: "Eliminar Publicada" }));
    const dialog = screen.getByRole("alertdialog", { name: "¿Eliminar esta obra del catálogo?" });
    const confirm = within(dialog).getByRole("button", { name: "Sí, eliminar" });
    expect(confirm).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(confirm);
    expect(await screen.findByRole("rowheader", { name: "Borrador" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Publicada" })).not.toBeInTheDocument();
  });

  it("Escape cierra el dialogo sin borrar", async () => {
    const user = userEvent.setup();
    render(<CurationList />);
    await user.click(await screen.findByRole("button", { name: "Eliminar Publicada" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(false);
  });

  it("busca enviando la consulta al backend", async () => {
    const user = userEvent.setup();
    render(<CurationList />);
    await user.type(await screen.findByLabelText("Buscar obras"), "nemo{Enter}");
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("q=nemo"))).toBe(true);
  });
});
