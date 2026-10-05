// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { pendingOps } from "@/shared/offline/outbox";
import { freshDb, makeComic } from "@/test/idb";

import { getPageBlobs } from "../repository";
import { DuplicateComicError, importComic, type ImportDeps } from "./import-comic";

const deps = (): ImportDeps => ({
  extractCbz: vi.fn(async () => [new Blob(["p1"]), new Blob(["p2"])]),
  renderPdf: vi.fn(async (_data, onPage) => {
    onPage?.(1, 1);
    return [new Blob(["pdf"])];
  }),
  makeThumbnail: vi.fn(async () => new Blob(["mini"])),
  newId: () => "11111111-2222-3333-4444-555555555555",
});

describe("importComic", () => {
  it("importa un CBZ: guarda páginas, miniatura y encola el registro", async () => {
    const db = await freshDb();
    const d = deps();
    const stages: string[] = [];
    const comic = await importComic(
      db,
      [new File(["contenido"], "Little_Nemo.cbz")],
      { readingDirection: "LEFT_TO_RIGHT", now: new Date("2026-10-05T00:00:00Z") },
      (p) => stages.push(p.stage),
      d,
    );
    expect(comic).toMatchObject({ title: "Little Nemo", format: "CBZ", pageCount: 2, hasFiles: true, createdAt: "2026-10-05T00:00:00.000Z" });
    expect(comic.fileSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(await (comic.cover as Blob).text()).toBe("mini");
    expect(await Promise.all((await getPageBlobs(db, comic.id)).map((b) => b.text()))).toEqual(["p1", "p2"]);
    expect((await pendingOps(db))[0].method).toBe("PUT");
    expect(stages).toEqual(["reading", "fingerprint", "pages", "saving", "done"]);
  });

  it("importa imágenes sueltas en orden natural", async () => {
    const db = await freshDb();
    const comic = await importComic(
      db,
      [new File(["b"], "pag_10.png", { type: "image/png" }), new File(["a"], "pag_2.png", { type: "image/png" })],
      { readingDirection: "RIGHT_TO_LEFT" },
      undefined,
      deps(),
    );
    expect(comic).toMatchObject({ format: "IMAGES", pageCount: 2, readingDirection: "RIGHT_TO_LEFT", title: "pag" });
    expect(await Promise.all((await getPageBlobs(db, comic.id)).map((b) => b.text()))).toEqual(["a", "b"]);
  });

  it("informa el avance de un PDF página a página", async () => {
    const db = await freshDb();
    const progress = vi.fn();
    await importComic(db, [new File(["%PDF"], "libro.pdf")], { readingDirection: "LEFT_TO_RIGHT" }, progress, deps());
    expect(progress).toHaveBeenCalledWith({ stage: "pages", done: 1, total: 1 });
  });

  it("no importa dos veces el mismo archivo", async () => {
    const db = await freshDb();
    const file = new File(["mismo"], "a.cbz");
    await importComic(db, [file], { readingDirection: "LEFT_TO_RIGHT" }, undefined, { ...deps(), newId: () => crypto.randomUUID() });
    await expect(
      importComic(db, [new File(["mismo"], "copia.cbz")], { readingDirection: "LEFT_TO_RIGHT" }, undefined, deps()),
    ).rejects.toBeInstanceOf(DuplicateComicError);
  });

  it("adjunta los archivos a un cómic que solo tenía datos (llegado de otro dispositivo)", async () => {
    const db = await freshDb();
    const file = new File(["contenido compartido"], "x.cbz");
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), (b) => b.toString(16).padStart(2, "0")).join("");
    const remoteOnly = makeComic({ id: "remoto-1", title: "Título del otro dispositivo", fileSha256: sha, hasFiles: false });
    await db.put("comics", remoteOnly);

    const comic = await importComic(db, [file], { readingDirection: "LEFT_TO_RIGHT" }, undefined, deps());
    expect(comic).toMatchObject({ id: "remoto-1", title: "Título del otro dispositivo", hasFiles: true });
    expect(await db.count("comics")).toBe(1);
  });

  it("rechaza archivos de más de 500 MB sin leerlos", async () => {
    const db = await freshDb();
    const huge = new File(["x"], "enorme.cbz");
    Object.defineProperty(huge, "size", { value: 600 * 1024 * 1024 });
    await expect(importComic(db, [huge], { readingDirection: "LEFT_TO_RIGHT" }, undefined, deps())).rejects.toThrow("500 MB");
  });
});
