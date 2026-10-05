// @vitest-environment node
import { describe, expect, it } from "vitest";

import { pendingOps } from "@/shared/offline/outbox";
import { freshDb, makeComic } from "@/test/idb";

import { deleteComic, findByFingerprint, getPageBlobs, listComics, saveImportedComic, toComicRequest, updateComic } from "./repository";

describe("repositorio de la biblioteca", () => {
  it("guarda cómic y páginas, y encola su registro", async () => {
    const db = await freshDb();
    const comic = makeComic({ pageCount: 3 });
    await saveImportedComic(db, comic, [new Blob(["1"]), new Blob(["2"]), new Blob(["3"])]);

    expect(await listComics(db)).toHaveLength(1);
    const pages = await getPageBlobs(db, comic.id);
    expect(await Promise.all(pages.map((p) => p.text()))).toEqual(["1", "2", "3"]);
    const [op] = await pendingOps(db);
    expect(op).toMatchObject({ key: `comic:${comic.id}`, method: "PUT", path: `/library/comics/${comic.id}` });
    expect(op.body).toEqual(toComicRequest(comic));
  });

  it("no envía archivos ni datos locales al backend", () => {
    const body = toComicRequest(makeComic());
    expect(Object.keys(body).sort()).toEqual(
      ["fileSha256", "format", "issueNumber", "pageCount", "readingDirection", "series", "tags", "title"].sort(),
    );
  });

  it("encuentra un cómic por su huella", async () => {
    const db = await freshDb();
    const comic = makeComic({ fileSha256: "b".repeat(64) });
    await saveImportedComic(db, comic, [new Blob(["x"])]);
    expect((await findByFingerprint(db, "b".repeat(64)))?.id).toBe(comic.id);
    expect(await findByFingerprint(db, "c".repeat(64))).toBeUndefined();
  });

  it("editar actualiza la fecha y reemplaza el envío pendiente", async () => {
    const db = await freshDb();
    const comic = makeComic();
    await saveImportedComic(db, comic, [new Blob(["x"])]);
    const updated = await updateComic(db, comic.id, { title: "Nuevo" }, new Date("2026-05-01T00:00:00Z"));
    expect(updated).toMatchObject({ title: "Nuevo", updatedAt: "2026-05-01T00:00:00.000Z" });
    const ops = await pendingOps(db);
    expect(ops).toHaveLength(1);
    expect((ops[0].body as { title: string }).title).toBe("Nuevo");
  });

  it("borrar quita páginas, progreso y marcadores, y encola el DELETE", async () => {
    const db = await freshDb();
    const comic = makeComic();
    await saveImportedComic(db, comic, [new Blob(["x"]), new Blob(["y"])]);
    await db.put("progress", { comicId: comic.id, currentPage: 1, currentPanel: 0, guidedMode: false, totalPages: 2, clientUpdatedAt: "", deviceId: "d" });
    await db.put("bookmarks", { id: "m1", comicId: comic.id, page: 1, note: null, createdAt: "" });

    await deleteComic(db, comic.id);

    expect(await listComics(db)).toHaveLength(0);
    expect(await db.count("pages")).toBe(0);
    expect(await db.get("progress", comic.id)).toBeUndefined();
    expect(await db.count("bookmarks")).toBe(0);
    const ops = await pendingOps(db);
    expect(ops.map((o) => o.method)).toEqual(["DELETE"]);
  });
});
