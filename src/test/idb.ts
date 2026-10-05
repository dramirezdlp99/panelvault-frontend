import "fake-indexeddb/auto";

import { openLocalDb, type LocalDb } from "@/shared/offline/db";
import type { LocalComic } from "@/shared/offline/types";

let counter = 0;

/** Base IndexedDB en memoria y nueva para cada prueba (fake-indexeddb). */
export function freshDb(): Promise<LocalDb> {
  counter += 1;
  return openLocalDb(`prueba-${counter}-${Math.random().toString(36).slice(2)}`);
}

export function makeComic(overrides: Partial<LocalComic> = {}): LocalComic {
  return {
    id: crypto.randomUUID(),
    title: "Cómic de prueba",
    series: null,
    issueNumber: null,
    pageCount: 10,
    format: "CBZ",
    fileSha256: "a".repeat(64),
    readingDirection: "LEFT_TO_RIGHT",
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    hasFiles: true,
    cover: null,
    ...overrides,
  };
}
