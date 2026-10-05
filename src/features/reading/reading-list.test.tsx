import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLocalDb } from "@/shared/offline/db";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { makeComic } from "@/test/idb";
import { jsonResponse } from "@/test/jwt";

import { ReadingList } from "./reading-list";

let userId: string;
let recent: unknown[];
beforeEach(() => {
  userId = crypto.randomUUID();
  recent = [];
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(recent)));
});
afterEach(() => vi.unstubAllGlobals());

const renderList = () =>
  render(
    <LocalStoreProvider userId={userId}>
      <ReadingList />
    </LocalStoreProvider>,
  );

const progress = (comicId: string, currentPage: number, clientUpdatedAt: string) => ({
  comicId,
  currentPage,
  currentPanel: 0,
  guidedMode: false,
  totalPages: 10,
  clientUpdatedAt,
  deviceId: "d1",
});

describe("ReadingList", () => {
  it("invita a empezar cuando no hay lecturas", async () => {
    renderList();
    expect(await screen.findByText("Aún no estás leyendo nada")).toBeInTheDocument();
  });

  it("muestra primero lo último leído", async () => {
    const db = await openLocalDb(userId);
    const a = makeComic({ title: "Antiguo", pageCount: 10 });
    const b = makeComic({ title: "Reciente", pageCount: 10 });
    await db.put("comics", a);
    await db.put("comics", b);
    await db.put("progress", progress(a.id, 3, "2026-01-01T00:00:00Z"));
    await db.put("progress", progress(b.id, 10, "2026-05-01T00:00:00Z"));
    db.close();

    renderList();
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Reciente", "Antiguo"]);
    expect(screen.getByText("Terminado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Releer" })).toHaveAttribute("href", `/lector?id=${b.id}`);
    expect(screen.getByRole("link", { name: "Continuar" })).toHaveAttribute("href", `/lector?id=${a.id}`);
  });

  it("incorpora el progreso más nuevo de otros dispositivos", async () => {
    const db = await openLocalDb(userId);
    const comic = makeComic({ title: "Compartido", pageCount: 10 });
    await db.put("comics", comic);
    await db.put("progress", progress(comic.id, 2, "2026-01-01T00:00:00Z"));
    db.close();
    recent = [{ comicId: comic.id, title: "Compartido", progress: { ...progress(comic.id, 7, "2026-06-01T00:00:00Z"), deviceId: "otro", finished: false, percent: 70, serverUpdatedAt: "" } }];

    renderList();
    expect(await screen.findByText(/Pág\. 7 de 10/)).toBeInTheDocument();
  });
});
