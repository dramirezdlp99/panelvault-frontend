/// <reference lib="webworker" />
/**
 * Web Worker propio para descomprimir un CBZ FUERA del hilo principal.
 *
 * - Primero lista las páginas (sin descomprimir), las ordena y después extrae UNA POR UNA,
 *   enviando cada imagen apenas está lista (entrega progresiva, sin un pico de memoria).
 * - Cada imagen viaja como Transferable: se "mueve" al hilo principal, no se copia.
 * - Si hay SharedArrayBuffer, escribe el avance en memoria compartida (Atomics) y revisa una
 *   bandera de cancelación que el hilo principal puede activar en cualquier momento.
 */
import { unzipSync } from "fflate";

import { isComicPage } from "./cbz-pages";
import { SHARED_CANCEL, SHARED_DONE, SHARED_TOTAL, type CbzWorkerMessage, type CbzWorkerRequest } from "./cbz-protocol";
import { MAX_PAGES, mimeFor, naturalCompare } from "./detect";

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<CbzWorkerRequest>) => {
  const { data, shared } = event.data;
  const state = shared ? new Int32Array(shared) : null;
  const zip = new Uint8Array(data);
  const post = (message: CbzWorkerMessage, transfer: Transferable[] = []) => scope.postMessage(message, transfer);

  try {
    // 1. Listar sin descomprimir: el filtro solo mira los nombres y devuelve false.
    const names: string[] = [];
    unzipSync(zip, { filter: (file) => (isComicPage(file.name) && names.push(file.name), false) });
    names.sort(naturalCompare);
    if (names.length === 0) return post({ type: "error", message: "El CBZ no contiene imágenes." });
    if (names.length > MAX_PAGES) return post({ type: "error", message: `El cómic supera el máximo de ${MAX_PAGES} páginas.` });

    if (state) Atomics.store(state, SHARED_TOTAL, names.length);
    post({ type: "total", total: names.length });

    // 2. Extraer de a una página y entregarla de inmediato.
    for (let index = 0; index < names.length; index++) {
      if (state && Atomics.load(state, SHARED_CANCEL) === 1) return post({ type: "cancelled" });
      const name = names[index];
      const file = unzipSync(zip, { filter: (f) => f.name === name })[name];
      const bytes = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
      post({ type: "page", index, name, mime: mimeFor(name), bytes }, [bytes]);
      if (state) Atomics.store(state, SHARED_DONE, index + 1);
    }
    post({ type: "done" });
  } catch {
    post({ type: "error", message: "El archivo CBZ está dañado o no es un ZIP válido." });
  }
};
