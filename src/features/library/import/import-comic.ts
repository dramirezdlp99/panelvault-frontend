import type { LocalDb } from "@/shared/offline/db";
import type { ComicFormat, LocalComic, ReadingDirection } from "@/shared/offline/types";

import { findByFingerprint, saveImportedComic } from "../repository";
import { detectFormat, ImportError, MAX_FILE_BYTES, mimeFor, naturalCompare, titleFromFileName } from "./detect";
import { extractCbz } from "./extract-cbz";
import { fingerprintOfParts, sha256Hex } from "./hash";
import { renderPdf } from "./render-pdf";
import { makeThumbnail } from "./thumbnail";

export type ImportStage = "reading" | "fingerprint" | "pages" | "saving" | "done";
export type ImportProgress = { stage: ImportStage; done?: number; total?: number };

export type ImportOptions = { readingDirection: ReadingDirection; now?: Date };

/** Piezas reemplazables en pruebas (el navegador real usa las de verdad). */
export type ImportDeps = {
  extractCbz: (data: Uint8Array) => Promise<Blob[]>;
  renderPdf: (data: Uint8Array, onPage?: (done: number, total: number) => void) => Promise<Blob[]>;
  makeThumbnail: (page: Blob) => Promise<Blob | null>;
  newId: () => string;
};

const defaultDeps: ImportDeps = { extractCbz, renderPdf, makeThumbnail, newId: () => crypto.randomUUID() };

export class DuplicateComicError extends ImportError {
  constructor(readonly existing: LocalComic) {
    super(`Este archivo ya está en tu biblioteca como «${existing.title}».`);
    this.name = "DuplicateComicError";
  }
}

async function readAll(files: File[]): Promise<ArrayBuffer[]> {
  return Promise.all(files.map((f) => f.arrayBuffer()));
}

/**
 * Importa un cómic al dispositivo:
 * 1. Detecta el formato y calcula la huella SHA-256 (para no importar dos veces lo mismo).
 * 2. Extrae las páginas como imágenes (CBZ: descomprime; PDF: dibuja cada página; imágenes: tal cual).
 * 3. Guarda todo en IndexedDB y encola el registro de metadatos en el backend.
 * Todo ocurre en el navegador: el archivo nunca se sube al servidor.
 */
export async function importComic(
  db: LocalDb,
  files: File[],
  options: ImportOptions,
  onProgress: (progress: ImportProgress) => void = () => {},
  deps: ImportDeps = defaultDeps,
): Promise<LocalComic> {
  const format: ComicFormat = detectFormat(files);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_FILE_BYTES) throw new ImportError("El archivo supera el máximo de 500 MB.");

  const ordered = format === "IMAGES" ? [...files].sort((a, b) => naturalCompare(a.name, b.name)) : files;

  onProgress({ stage: "reading" });
  const buffers = await readAll(ordered);

  onProgress({ stage: "fingerprint" });
  const fingerprint = format === "IMAGES" ? await fingerprintOfParts(buffers) : await sha256Hex(buffers[0]);
  const existing = await findByFingerprint(db, fingerprint);
  // Si el cómic llegó desde otro dispositivo (solo datos), el archivo se le adjunta en vez de duplicarlo.
  if (existing?.hasFiles) throw new DuplicateComicError(existing);

  onProgress({ stage: "pages" });
  let pages: Blob[];
  if (format === "CBZ") pages = await deps.extractCbz(new Uint8Array(buffers[0]));
  else if (format === "PDF") pages = await deps.renderPdf(new Uint8Array(buffers[0]), (done, total) => onProgress({ stage: "pages", done, total }));
  else pages = ordered.map((file, i) => new Blob([buffers[i]], { type: file.type || mimeFor(file.name) }));
  if (pages.length === 0) throw new ImportError("No se encontraron páginas.");

  onProgress({ stage: "saving" });
  const now = (options.now ?? new Date()).toISOString();
  const comic: LocalComic = existing
    ? { ...existing, pageCount: pages.length, hasFiles: true, updatedAt: now, cover: await deps.makeThumbnail(pages[0]) }
    : {
    id: deps.newId(),
    title: format === "IMAGES" && files.length > 1 ? titleFromFileName(ordered[0].name.replace(/[\s_-]*\d+(\.[^.]+)$/, "$1")) : titleFromFileName(files[0].name),
    series: null,
    issueNumber: null,
    pageCount: pages.length,
    format,
    fileSha256: fingerprint,
    readingDirection: options.readingDirection,
    tags: [],
    createdAt: now,
    updatedAt: now,
    hasFiles: true,
    cover: await deps.makeThumbnail(pages[0]),
  };
  await saveImportedComic(db, comic, pages);
  onProgress({ stage: "done" });
  return comic;
}
