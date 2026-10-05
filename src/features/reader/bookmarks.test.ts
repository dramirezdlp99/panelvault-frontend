// @vitest-environment node
import { describe, expect, it } from "vitest";

import { pendingOps } from "@/shared/offline/outbox";
import { freshDb } from "@/test/idb";

import { listBookmarks, mergeRemoteBookmarks, removeBookmark, saveBookmark } from "./bookmarks";

const bookmark = { id: "b1", comicId: "c1", page: 4, note: "  Nota  ", createdAt: "2026-10-01T00:00:00Z" };

describe("marcadores", () => {
  it("guarda limpiando la nota y encola un PUT idempotente", async () => {
    const db = await freshDb();
    await saveBookmark(db, bookmark);
    expect((await listBookmarks(db, "c1"))[0].note).toBe("Nota");
    const [op] = await pendingOps(db);
    expect(op).toMatchObject({ method: "PUT", path: "/reading/comics/c1/bookmarks/b1", body: { page: 4, note: "Nota" } });
  });

  it("una nota vacía se guarda como null y se recorta a 200 caracteres", async () => {
    const db = await freshDb();
    await saveBookmark(db, { ...bookmark, note: "   " });
    expect((await listBookmarks(db, "c1"))[0].note).toBeNull();
    await saveBookmark(db, { ...bookmark, note: "x".repeat(300) });
    expect((await listBookmarks(db, "c1"))[0].note).toHaveLength(200);
  });

  it("borrar reemplaza el envío pendiente por un DELETE", async () => {
    const db = await freshDb();
    await saveBookmark(db, bookmark);
    await removeBookmark(db, "b1");
    expect(await listBookmarks(db, "c1")).toEqual([]);
    const ops = await pendingOps(db);
    expect(ops.map((o) => [o.method, o.path])).toEqual([["DELETE", "/reading/bookmarks/b1"]]);
  });

  it("lista ordenado por página", async () => {
    const db = await freshDb();
    await saveBookmark(db, { ...bookmark, id: "b2", page: 9 });
    await saveBookmark(db, { ...bookmark, id: "b3", page: 1 });
    expect((await listBookmarks(db, "c1")).map((b) => b.page)).toEqual([1, 9]);
  });

  it("trae los de otros dispositivos sin revivir los borrados aquí", async () => {
    const db = await freshDb();
    await saveBookmark(db, bookmark);
    await removeBookmark(db, "b1");
    const added = await mergeRemoteBookmarks(db, [
      { ...bookmark, note: "remoto" },
      { id: "b9", comicId: "c1", page: 2, note: null, createdAt: "" },
    ]);
    expect(added).toBe(1);
    expect((await listBookmarks(db, "c1")).map((b) => b.id)).toEqual(["b9"]);
  });
});
