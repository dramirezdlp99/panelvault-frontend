import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLocalDb } from "@/shared/offline/db";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { pendingOps } from "@/shared/offline/outbox";
import { makeComic } from "@/test/idb";
import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter, router } from "@/test/router";

import { ComicDetail } from "./comic-detail";

vi.mock("next/navigation", () => nextNavigationMock());

let userId: string;
beforeEach(() => {
  resetRouter();
  userId = crypto.randomUUID();
  // Sin red: lo encolado queda pendiente para revisarlo.
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 503, code: "backend.unavailable", message: "x" }, 503)));
});
afterEach(() => vi.unstubAllGlobals());

async function seed(overrides = {}) {
  const db = await openLocalDb(userId);
  const comic = makeComic({ title: "Krazy Kat", series: "Herriman", issueNumber: "3", pageCount: 8, tags: ["humor"], ...overrides });
  await db.put("comics", comic);
  await db.put("bookmarks", { id: "m1", comicId: comic.id, page: 4, note: "La del ladrillo", createdAt: "" });
  db.close();
  return comic;
}

const renderDetail = (id: string) =>
  render(
    <LocalStoreProvider userId={userId}>
      <ComicDetail id={id} />
    </LocalStoreProvider>,
  );

describe("ComicDetail", () => {
  it("muestra datos, marcadores y el acceso al lector", async () => {
    const comic = await seed();
    renderDetail(comic.id);
    expect(await screen.findByRole("heading", { level: 1, name: "Krazy Kat" })).toBeInTheDocument();
    expect(screen.getByText("Herriman · #3")).toBeInTheDocument();
    expect(screen.getByText("La del ladrillo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir a la página/i })).toHaveAttribute("href", `/lector?id=${comic.id}&pagina=4`);
    expect(screen.getByRole("link", { name: /empezar a leer/i })).toHaveAttribute("href", `/lector?id=${comic.id}`);
  });

  it("edita y encola el cambio", async () => {
    const comic = await seed();
    const user = userEvent.setup();
    renderDetail(comic.id);
    await user.click(await screen.findByRole("button", { name: /editar/i }));
    const title = screen.getByLabelText("Título");
    await user.clear(title);
    await user.type(title, "Krazy Kat (1913)");
    await user.click(screen.getByRole("button", { name: /guardar/i }));
    expect(await screen.findByRole("heading", { level: 1, name: "Krazy Kat (1913)" })).toBeInTheDocument();
    const db = await openLocalDb(userId);
    expect((await pendingOps(db)).some((op) => (op.body as { title?: string })?.title === "Krazy Kat (1913)")).toBe(true);
    db.close();
  });

  it("elimina tras confirmar y vuelve a la biblioteca", async () => {
    const comic = await seed();
    const user = userEvent.setup();
    renderDetail(comic.id);
    await user.click(await screen.findByRole("button", { name: /eliminar cómic/i }));
    await user.click(screen.getByRole("checkbox", { name: /entiendo/i }));
    await user.click(screen.getByRole("button", { name: /sí, eliminar cómic/i }));
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/biblioteca"));
  });

  it("explica cuando los archivos están en otro dispositivo", async () => {
    const comic = await seed({ hasFiles: false });
    renderDetail(comic.id);
    expect(await screen.findByText("Los archivos están en otro dispositivo")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /empezar a leer/i })).not.toBeInTheDocument();
  });

  it("avisa si el cómic no está en este dispositivo", async () => {
    renderDetail("no-existe");
    expect(await screen.findByText("Cómic no encontrado")).toBeInTheDocument();
  });
});
