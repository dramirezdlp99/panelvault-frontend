import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { LocalBookmark, LocalComic, LocalPage, LocalPanelMap, LocalProgress, OutboxOp } from "./types";

export interface PanelVaultDB extends DBSchema {
  comics: { key: string; value: LocalComic; indexes: { byFingerprint: string } };
  pages: { key: [string, number]; value: LocalPage; indexes: { byComic: string } };
  progress: { key: string; value: LocalProgress };
  bookmarks: { key: string; value: LocalBookmark; indexes: { byComic: string } };
  panelMaps: { key: [string, string]; value: LocalPanelMap };
  outbox: { key: number; value: OutboxOp; indexes: { byKey: string } };
}

export type LocalDb = IDBPDatabase<PanelVaultDB>;

export const DB_VERSION = 1;

/** Una base por usuario: si dos personas usan el mismo navegador, sus bibliotecas no se mezclan. */
export function dbNameFor(userId: string): string {
  return `panelvault-${userId}`;
}

export function openLocalDb(userId: string): Promise<LocalDb> {
  return openDB<PanelVaultDB>(dbNameFor(userId), DB_VERSION, {
    upgrade(db) {
      const comics = db.createObjectStore("comics", { keyPath: "id" });
      comics.createIndex("byFingerprint", "fileSha256");
      const pages = db.createObjectStore("pages", { keyPath: ["comicId", "index"] });
      pages.createIndex("byComic", "comicId");
      db.createObjectStore("progress", { keyPath: "comicId" });
      const bookmarks = db.createObjectStore("bookmarks", { keyPath: "id" });
      bookmarks.createIndex("byComic", "comicId");
      db.createObjectStore("panelMaps", { keyPath: ["pageSha256", "preset"] });
      const outbox = db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      outbox.createIndex("byKey", "key");
    },
  });
}

/** Evento que avisa a las pantallas que los datos locales cambiaron y deben releerse. */
export const DB_CHANGED_EVENT = "panelvault:db-changed";

export function notifyDbChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
}
