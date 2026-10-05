import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLocalDb } from "@/shared/offline/db";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { makeComic } from "@/test/idb";
import { jsonResponse } from "@/test/jwt";

import { BookmarksView } from "./bookmarks-view";

let userId: string;
beforeEach(() => {
  userId = crypto.randomUUID();
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 503, code: "backend.unavailable", message: "x" }, 503)));
});
afterEach(() => vi.unstubAllGlobals());

const renderView = () =>
  render(
    <LocalStoreProvider userId={userId}>
      <BookmarksView />
    </LocalStoreProvider>,
  );

async function seed() {
  const db = await openLocalDb(userId);
  const krazy = makeComic({ title: "Krazy Kat" });
  const nemo = makeComic({ title: "Little Nemo", hasFiles: false });
  await db.put("comics", krazy);
  await db.put("comics", nemo);
  await db.put("bookmarks", { id: "b1", comicId: krazy.id, page: 9, note: null, createdAt: "2026-10-01T00:00:00Z" });
  await db.put("bookmarks", { id: "b2", comicId: krazy.id, page: 2, note: "El ladrillo", createdAt: "2026-10-01T00:00:00Z" });
  await db.put("bookmarks", { id: "b3", comicId: nemo.id, page: 1, note: null, createdAt: "2026-10-01T00:00:00Z" });
  db.close();
  return { krazy };
}

describe("BookmarksView", () => {
  it("agrupa por cómic y ordena por página", async () => {
    const { krazy } = await seed();
    renderView();
    const group = (await screen.findByRole("region", { name: /krazy kat/i })) as HTMLElement;
    const pages = within(group).getAllByText(/^Página \d+$/).map((el) => el.textContent);
    expect(pages).toEqual(["Página 2", "Página 9"]);
    expect(within(group).getAllByRole("link", { name: "Ir a la página" })[0]).toHaveAttribute("href", `/lector?id=${krazy.id}&pagina=2`);
    expect(screen.getByText("Archivo en otro dispositivo")).toBeInTheDocument();
  });

  it("edita la nota y elimina un marcador", async () => {
    await seed();
    const user = userEvent.setup();
    renderView();
    await user.click(await screen.findByRole("button", { name: "Editar nota de la página 9" }, { timeout: 3000 }));
    await user.type(screen.getByLabelText("Nota del marcador"), "Final feliz");
    await user.click(screen.getByRole("button", { name: /guardar nota/i }));
    await vi.waitFor(() => expect(screen.getByText("Final feliz")).toBeInTheDocument(), { timeout: 3000 });

    await user.click(screen.getByRole("button", { name: "Eliminar marcador de la página 2" }));
    await vi.waitFor(() => expect(screen.queryByText("El ladrillo")).not.toBeInTheDocument(), { timeout: 3000 });
  });

  it("estado vacío", async () => {
    renderView();
    expect(await screen.findByText("Aún no tienes marcadores")).toBeInTheDocument();
  });
});
