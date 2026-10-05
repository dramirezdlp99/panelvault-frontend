import type { Page } from "@/shared/api/types";
import { notifyDbChanged, type LocalDb } from "@/shared/offline/db";
import { enqueue, pendingOps } from "@/shared/offline/outbox";
import type { LocalComic } from "@/shared/offline/types";

import { comicPath, toComicRequest } from "./repository";
import type { RemoteComic } from "./types";

export type FetchComicsPage = (page: number) => Promise<Page<RemoteComic>>;

export type PullResult = { added: number; updated: number; removed: number; republished: number };

/** Trae todas las páginas del backend (100 por página, el máximo permitido). */
export async function fetchAllRemote(fetchPage: FetchComicsPage): Promise<RemoteComic[]> {
  const all: RemoteComic[] = [];
  for (let page = 0; ; page++) {
    const result = await fetchPage(page);
    all.push(...result.items);
    if (page + 1 >= result.totalPages || result.items.length === 0) return all;
  }
}

function fromRemote(remote: RemoteComic): LocalComic {
  return {
    id: remote.id,
    title: remote.title,
    series: remote.series,
    issueNumber: remote.issueNumber,
    pageCount: remote.pageCount,
    format: remote.format,
    fileSha256: remote.fileSha256,
    readingDirection: remote.readingDirection,
    tags: remote.tags,
    createdAt: remote.createdAt,
    updatedAt: remote.updatedAt,
    hasFiles: false,
    cover: null,
  };
}

/**
 * Une la biblioteca del backend con la local:
 * - Lo que solo está en el servidor llega como "solo datos" (los archivos viven en cada dispositivo).
 * - Si el servidor tiene una edición más nueva y aquí no hay cambios pendientes, se toma la del servidor.
 * - Un cómic con archivos que el servidor no conoce se vuelve a registrar (los archivos mandan).
 * - Un cómic sin archivos que ya no está en el servidor se borró en otro dispositivo: se quita.
 */
export async function mergeRemote(db: LocalDb, remote: RemoteComic[]): Promise<PullResult> {
  const result: PullResult = { added: 0, updated: 0, removed: 0, republished: 0 };
  const pendingKeys = new Set((await pendingOps(db)).map((op) => op.key));
  const remoteIds = new Set(remote.map((r) => r.id));
  const locals = new Map((await db.getAll("comics")).map((c) => [c.id, c]));

  for (const item of remote) {
    const local = locals.get(item.id);
    if (pendingKeys.has(`comic:${item.id}`)) continue;
    if (!local) {
      await db.put("comics", fromRemote(item));
      result.added++;
    } else if (item.updatedAt > local.updatedAt) {
      await db.put("comics", { ...fromRemote(item), hasFiles: local.hasFiles, cover: local.cover });
      result.updated++;
    }
  }

  for (const local of locals.values()) {
    if (remoteIds.has(local.id) || pendingKeys.has(`comic:${local.id}`)) continue;
    if (local.hasFiles) {
      await enqueue(db, { key: `comic:${local.id}`, method: "PUT", path: comicPath(local.id), body: toComicRequest(local) });
      result.republished++;
    } else {
      await db.delete("comics", local.id);
      result.removed++;
    }
  }

  if (result.added + result.updated + result.removed > 0) notifyDbChanged();
  return result;
}
