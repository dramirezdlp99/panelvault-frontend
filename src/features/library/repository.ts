import { notifyDbChanged, type LocalDb } from "@/shared/offline/db";
import { enqueue } from "@/shared/offline/outbox";
import type { LocalComic, LocalPage, LocalProgress } from "@/shared/offline/types";

/** Ruta del cómic en el BFF (sin el prefijo /api/pv). */
export const comicPath = (id: string) => `/library/comics/${encodeURIComponent(id)}`;

/** Cuerpo que espera el backend (ComicRequest): solo metadatos, nunca el archivo. */
export function toComicRequest(comic: LocalComic) {
  return {
    title: comic.title,
    series: comic.series,
    issueNumber: comic.issueNumber,
    pageCount: comic.pageCount,
    format: comic.format,
    fileSha256: comic.fileSha256,
    readingDirection: comic.readingDirection,
    tags: comic.tags,
  };
}

function enqueueSave(db: LocalDb, comic: LocalComic) {
  return enqueue(db, { key: `comic:${comic.id}`, method: "PUT", path: comicPath(comic.id), body: toComicRequest(comic) });
}

export async function listComics(db: LocalDb): Promise<LocalComic[]> {
  return db.getAll("comics");
}

export function getComic(db: LocalDb, id: string): Promise<LocalComic | undefined> {
  return db.get("comics", id);
}

export async function findByFingerprint(db: LocalDb, sha256: string): Promise<LocalComic | undefined> {
  return db.getFromIndex("comics", "byFingerprint", sha256);
}

/** Guarda el cómic y sus páginas en una sola transacción, y encola su registro en el backend. */
export async function saveImportedComic(db: LocalDb, comic: LocalComic, pages: Blob[]): Promise<void> {
  const tx = db.transaction(["comics", "pages"], "readwrite");
  await tx.objectStore("comics").put(comic);
  for (const [index, blob] of pages.entries()) {
    await tx.objectStore("pages").put({ comicId: comic.id, index, blob } satisfies LocalPage);
  }
  await tx.done;
  await enqueueSave(db, comic);
  notifyDbChanged();
}

export type ComicPatch = Partial<Pick<LocalComic, "title" | "series" | "issueNumber" | "readingDirection" | "tags">>;

/** Edita los metadatos localmente y encola el cambio (gana la última edición). */
export async function updateComic(db: LocalDb, id: string, patch: ComicPatch, now = new Date()): Promise<LocalComic> {
  const current = await db.get("comics", id);
  if (!current) throw new Error("El cómic no existe en este dispositivo");
  const updated: LocalComic = { ...current, ...patch, updatedAt: now.toISOString() };
  await db.put("comics", updated);
  await enqueueSave(db, updated);
  notifyDbChanged();
  return updated;
}

/** Borra el cómic de este dispositivo (archivos, progreso, marcadores) y encola el borrado remoto. */
export async function deleteComic(db: LocalDb, id: string): Promise<void> {
  const tx = db.transaction(["comics", "pages", "progress", "bookmarks"], "readwrite");
  await tx.objectStore("comics").delete(id);
  for (const key of await tx.objectStore("pages").index("byComic").getAllKeys(id)) {
    await tx.objectStore("pages").delete(key);
  }
  await tx.objectStore("progress").delete(id);
  for (const key of await tx.objectStore("bookmarks").index("byComic").getAllKeys(id)) {
    await tx.objectStore("bookmarks").delete(key);
  }
  await tx.done;
  await enqueue(db, { key: `comic:${id}`, method: "DELETE", path: comicPath(id), body: null });
  notifyDbChanged();
}

export async function getPageBlobs(db: LocalDb, comicId: string): Promise<Blob[]> {
  const pages = await db.getAllFromIndex("pages", "byComic", comicId);
  return pages.sort((a, b) => a.index - b.index).map((p) => p.blob);
}

export function getProgress(db: LocalDb, comicId: string): Promise<LocalProgress | undefined> {
  return db.get("progress", comicId);
}

export function listProgress(db: LocalDb): Promise<LocalProgress[]> {
  return db.getAll("progress");
}
