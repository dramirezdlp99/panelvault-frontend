import { notifyDbChanged, type LocalDb } from "@/shared/offline/db";
import { enqueue, pendingOps } from "@/shared/offline/outbox";
import type { LocalBookmark } from "@/shared/offline/types";

export type RemoteBookmark = { id: string; comicId: string; page: number; note: string | null; createdAt: string };

export const MAX_NOTE_LENGTH = 200;

const savePath = (b: Pick<LocalBookmark, "id" | "comicId">) =>
  `/reading/comics/${encodeURIComponent(b.comicId)}/bookmarks/${encodeURIComponent(b.id)}`;
const deletePath = (id: string) => `/reading/bookmarks/${encodeURIComponent(id)}`;

export function listBookmarks(db: LocalDb, comicId: string): Promise<LocalBookmark[]> {
  return db.getAllFromIndex("bookmarks", "byComic", comicId).then((list) => list.sort((a, b) => a.page - b.page));
}

/** Crea o edita un marcador (id del cliente → PUT idempotente). */
export async function saveBookmark(db: LocalDb, bookmark: LocalBookmark): Promise<void> {
  const note = bookmark.note?.trim().slice(0, MAX_NOTE_LENGTH) || null;
  const clean = { ...bookmark, note };
  await db.put("bookmarks", clean);
  await enqueue(db, { key: `bookmark:${clean.id}`, method: "PUT", path: savePath(clean), body: { page: clean.page, note } });
  notifyDbChanged();
}

export async function removeBookmark(db: LocalDb, id: string): Promise<void> {
  await db.delete("bookmarks", id);
  await enqueue(db, { key: `bookmark:${id}`, method: "DELETE", path: deletePath(id), body: null });
  notifyDbChanged();
}

/** Agrega los marcadores creados en otros dispositivos (sin revivir los que se borraron aquí). */
export async function mergeRemoteBookmarks(db: LocalDb, remote: RemoteBookmark[]): Promise<number> {
  const pending = new Set((await pendingOps(db)).map((op) => op.key));
  let added = 0;
  for (const item of remote) {
    if (pending.has(`bookmark:${item.id}`)) continue;
    if (!(await db.get("bookmarks", item.id))) {
      await db.put("bookmarks", { id: item.id, comicId: item.comicId, page: item.page, note: item.note, createdAt: item.createdAt });
      added++;
    }
  }
  if (added > 0) notifyDbChanged();
  return added;
}
