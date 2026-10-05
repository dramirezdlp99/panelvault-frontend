export type ComicFormat = "CBZ" | "CBR" | "PDF" | "IMAGES";
export type ReadingDirection = "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT";

/** Cómic guardado en este dispositivo. Los metadatos se sincronizan; los archivos, nunca. */
export type LocalComic = {
  /** UUID generado en el cliente: permite crear sin conexión y reintentar sin duplicar (PUT idempotente). */
  id: string;
  title: string;
  series: string | null;
  issueNumber: string | null;
  pageCount: number;
  format: ComicFormat;
  /** SHA-256 del archivo original: evita importar dos veces el mismo cómic. */
  fileSha256: string;
  readingDirection: ReadingDirection;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** false cuando el cómic llegó desde otro dispositivo y aquí solo están sus datos. */
  hasFiles: boolean;
  /** Miniatura de la portada (primera página reducida). */
  cover: Blob | null;
};

/** Una página del cómic, guardada como imagen. */
export type LocalPage = { comicId: string; index: number; blob: Blob };

/** Progreso de lectura. Se resuelve con "gana el último en escribir" según clientUpdatedAt. */
export type LocalProgress = {
  comicId: string;
  currentPage: number;
  currentPanel: number;
  guidedMode: boolean;
  totalPages: number;
  clientUpdatedAt: string;
  deviceId: string;
};

export type LocalBookmark = { id: string; comicId: string; page: number; note: string | null; createdAt: string };

/** Resultado de análisis de viñetas guardado para leer sin conexión. */
export type LocalPanelMap = { pageSha256: string; preset: string; result: unknown; savedAt: string };

/** Cambio pendiente de enviar al backend. */
export type OutboxOp = {
  id?: number;
  /** Operaciones con la misma clave se reemplazan: solo importa la última (p. ej. el progreso). */
  key: string;
  method: "PUT" | "DELETE" | "POST";
  path: string;
  body: unknown;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};
