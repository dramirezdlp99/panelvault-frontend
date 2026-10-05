import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLocalDb } from "@/shared/offline/db";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { makeComic } from "@/test/idb";
import { jsonResponse } from "@/test/jwt";
import { navigation, nextNavigationMock, resetRouter } from "@/test/router";

import { LibraryView } from "./library-view";

vi.mock("next/navigation", () => nextNavigationMock());

let userId: string;
beforeEach(() => {
  resetRouter();
  userId = crypto.randomUUID();
  // Backend no disponible: la biblioteca debe funcionar solo con lo guardado en el dispositivo.
  vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
});
afterEach(() => vi.unstubAllGlobals());

function renderLibrary() {
  return render(
    <LocalStoreProvider userId={userId}>
      <LibraryView />
    </LocalStoreProvider>,
  );
}

async function seed() {
  const db = await openLocalDb(userId);
  const nemo = makeComic({ title: "Little Nemo", pageCount: 10, updatedAt: "2026-02-01T00:00:00Z" });
  const akira = makeComic({ title: "Akira", format: "PDF", readingDirection: "RIGHT_TO_LEFT", pageCount: 20, hasFiles: false });
  await db.put("comics", nemo);
  await db.put("comics", akira);
  await db.put("progress", { comicId: nemo.id, currentPage: 10, currentPanel: 0, guidedMode: false, totalPages: 10, clientUpdatedAt: "2026-03-01T00:00:00Z", deviceId: "d" });
  db.close();
  return { nemo, akira };
}

describe("LibraryView", () => {
  it("invita a importar cuando la biblioteca está vacía", async () => {
    renderLibrary();
    expect(await screen.findByText("Importa tu primer cómic")).toBeInTheDocument();
  });

  it("muestra estadísticas y tarjetas desde IndexedDB", async () => {
    const { nemo } = await seed();
    renderLibrary();
    const card = (await screen.findByRole("heading", { name: "Little Nemo" })).closest("li")!;
    expect(within(card).getByRole("link", { name: /releer/i })).toHaveAttribute("href", `/lector?id=${nemo.id}`);
    expect(screen.getByText("Terminados").parentElement!.nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("Solo datos")).toBeInTheDocument();
  });

  it("filtra por dirección de lectura", async () => {
    await seed();
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("heading", { name: "Akira" });
    await user.click(screen.getByRole("button", { name: "Manga" }));
    expect(screen.queryByRole("heading", { name: "Little Nemo" })).not.toBeInTheDocument();
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("aplica la búsqueda de la URL", async () => {
    await seed();
    navigation.searchParams = new URLSearchParams("q=nemo");
    renderLibrary();
    await screen.findByRole("heading", { name: "Little Nemo" });
    expect(screen.queryByRole("heading", { name: "Akira" })).not.toBeInTheDocument();
    expect(screen.getByText(/Resultados para «nemo»/)).toBeInTheDocument();
  });

  it("con conexión, quita los cómics sin archivos que se borraron en otro dispositivo", async () => {
    await seed();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ items: [], page: 0, size: 100, totalItems: 0, totalPages: 0 })));
    renderLibrary();
    expect(await screen.findByRole("heading", { name: "Little Nemo" })).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole("heading", { name: "Akira" })).not.toBeInTheDocument(), { timeout: 3000 });
  });

  it("abre el diálogo de importación", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click((await screen.findAllByRole("button", { name: /importar cómic/i }))[0]);
    expect(screen.getByRole("dialog", { name: "Importar cómic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar" })).toBeDisabled();
  });
});
