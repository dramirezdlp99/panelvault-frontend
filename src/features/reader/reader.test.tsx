import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLocalDb } from "@/shared/offline/db";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { makeComic } from "@/test/idb";
import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter } from "@/test/router";

import { Reader } from "./reader";

vi.mock("next/navigation", () => nextNavigationMock());

let userId: string;
beforeEach(() => {
  resetRouter();
  userId = crypto.randomUUID();
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 404, code: "reading.no_progress", message: "x" }, 404)));
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:pagina"), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

const pages = [new Blob(["1"]), new Blob(["2"]), new Blob(["3"])];

function renderReader(overrides = {}, props: Partial<Parameters<typeof Reader>[0]> = {}) {
  const comic = makeComic({ title: "Nemo", pageCount: 3, ...overrides });
  render(
    <LocalStoreProvider userId={userId}>
      <Reader comic={comic} pages={pages} {...props} />
    </LocalStoreProvider>,
  );
  return comic;
}

describe("Reader", () => {
  it("empieza en la página guardada o en la pedida", () => {
    renderReader({}, { startPage: 2 });
    expect(screen.getByRole("region", { name: "Página 2 de 3" })).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("avanza con el teclado y con el botón", async () => {
    const user = userEvent.setup();
    renderReader();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("en manga la flecha izquierda avanza", async () => {
    const user = userEvent.setup();
    renderReader({ readingDirection: "RIGHT_TO_LEFT" });
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("marca la página y guarda el progreso en el dispositivo", async () => {
    const user = userEvent.setup();
    const comic = renderReader();
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    const mark = screen.getByRole("button", { name: "Marcar esta página" });
    await vi.waitFor(() => expect(mark).toBeEnabled());
    await user.click(mark);
    expect(await screen.findByText("Página 2 guardada en tus marcadores. Puedes añadirle una nota desde Marcadores.")).toBeInTheDocument();
    const db = await openLocalDb(userId);
    // El progreso se guarda tras una breve espera (600 ms) para no escribir en cada clic.
    await vi.waitFor(async () => expect((await db.get("progress", comic.id))?.currentPage).toBe(2), { timeout: 3000 });
    expect((await db.getAll("bookmarks")).map((b) => b.page)).toEqual([2]);
    db.close();
  });

  it("cambia al modo viñeta por viñeta", async () => {
    const user = userEvent.setup();
    renderReader();
    await user.click(screen.getByRole("button", { name: "Viñeta por viñeta" }));
    expect(screen.getByRole("button", { name: "Viñeta por viñeta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("complementary", { name: "Viñeta por viñeta" })).toBeInTheDocument();
  });
});
