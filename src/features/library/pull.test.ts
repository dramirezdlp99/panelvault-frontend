// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { enqueue, pendingOps } from "@/shared/offline/outbox";
import { freshDb, makeComic } from "@/test/idb";

import { fetchAllRemote, mergeRemote } from "./pull";
import type { RemoteComic } from "./types";

const remote = (overrides: Partial<RemoteComic> = {}): RemoteComic => ({
  id: crypto.randomUUID(),
  title: "Remoto",
  series: null,
  issueNumber: null,
  pageCount: 5,
  format: "PDF",
  fileSha256: "d".repeat(64),
  readingDirection: "RIGHT_TO_LEFT",
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  ...overrides,
});

describe("fetchAllRemote", () => {
  it("recorre todas las páginas", async () => {
    const fetchPage = vi.fn(async (page: number) => ({ items: [remote({ title: `p${page}` })], page, size: 100, totalItems: 3, totalPages: 3 }));
    const all = await fetchAllRemote(fetchPage);
    expect(all.map((c) => c.title)).toEqual(["p0", "p1", "p2"]);
  });

  it("termina con una página vacía", async () => {
    const all = await fetchAllRemote(async () => ({ items: [], page: 0, size: 100, totalItems: 0, totalPages: 0 }));
    expect(all).toEqual([]);
  });
});

describe("mergeRemote", () => {
  it("agrega como 'solo datos' lo registrado en otro dispositivo", async () => {
    const db = await freshDb();
    const item = remote();
    const result = await mergeRemote(db, [item]);
    expect(result.added).toBe(1);
    expect(await db.get("comics", item.id)).toMatchObject({ title: "Remoto", hasFiles: false, cover: null });
  });

  it("toma la versión más nueva del servidor conservando los archivos locales", async () => {
    const db = await freshDb();
    const local = makeComic({ updatedAt: "2026-01-01T00:00:00.000Z" });
    await db.put("comics", local);
    const result = await mergeRemote(db, [remote({ id: local.id, title: "Editado en el celular", updatedAt: "2026-02-01T00:00:00.000Z" })]);
    expect(result.updated).toBe(1);
    expect(await db.get("comics", local.id)).toMatchObject({ title: "Editado en el celular", hasFiles: true });
  });

  it("no pisa una edición local pendiente de enviar", async () => {
    const db = await freshDb();
    const local = makeComic({ title: "Mi edición" });
    await db.put("comics", local);
    await enqueue(db, { key: `comic:${local.id}`, method: "PUT", path: "/x", body: {} });
    await mergeRemote(db, [remote({ id: local.id, title: "Viejo", updatedAt: "2030-01-01T00:00:00.000Z" })]);
    expect((await db.get("comics", local.id))?.title).toBe("Mi edición");
  });

  it("vuelve a registrar un cómic con archivos que el servidor no conoce", async () => {
    const db = await freshDb();
    const local = makeComic();
    await db.put("comics", local);
    const result = await mergeRemote(db, []);
    expect(result.republished).toBe(1);
    expect((await pendingOps(db))[0]).toMatchObject({ method: "PUT", key: `comic:${local.id}` });
  });

  it("quita un cómic sin archivos que se borró en otro dispositivo", async () => {
    const db = await freshDb();
    const local = makeComic({ hasFiles: false });
    await db.put("comics", local);
    const result = await mergeRemote(db, []);
    expect(result.removed).toBe(1);
    expect(await db.get("comics", local.id)).toBeUndefined();
  });
});
