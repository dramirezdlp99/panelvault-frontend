/** Mensajes entre el hilo principal y el worker de CBZ (sin código ejecutable: se importa en ambos lados). */
export type CbzWorkerRequest = { data: ArrayBuffer; shared?: SharedArrayBuffer };
export type CbzWorkerMessage =
  | { type: "total"; total: number }
  | { type: "page"; index: number; name: string; mime: string; bytes: ArrayBuffer }
  | { type: "done" }
  | { type: "cancelled" }
  | { type: "error"; message: string };

/** Posiciones dentro de la memoria compartida (Int32Array de 3 casillas). */
export const SHARED_DONE = 0;
export const SHARED_TOTAL = 1;
export const SHARED_CANCEL = 2;
