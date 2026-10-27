import { extractCbz } from "./extract-cbz";
import { SHARED_CANCEL, SHARED_DONE, SHARED_TOTAL, type CbzWorkerMessage } from "./cbz-protocol";
import { ImportError } from "./detect";

export class ImportCancelledError extends ImportError {
  constructor() {
    super("Importación cancelada.");
    this.name = "ImportCancelledError";
  }
}

/** Control de una importación en curso: avance en vivo y cancelación. */
export type ExtractControl = {
  onProgress?: (done: number, total: number) => void;
  /** Se activa para cancelar; con SharedArrayBuffer el worker la ve sin esperar mensajes. */
  signal?: AbortSignal;
};

/** ¿Este navegador permite memoria compartida? Exige aislamiento de origen cruzado (COOP + COEP). */
export function canShareMemory(): boolean {
  return typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
}

/**
 * Descomprime un CBZ en un Web Worker propio y entrega las páginas en orden.
 * Si el navegador no tiene Worker (por ejemplo en pruebas), usa la versión asíncrona de fflate.
 */
export function extractCbzInWorker(data: Uint8Array, control: ExtractControl = {}): Promise<Blob[]> {
  if (typeof Worker === "undefined") return extractCbz(data);

  return new Promise<Blob[]>((resolve, reject) => {
    const worker = new Worker(new URL("./cbz.worker.ts", import.meta.url), { type: "module" });
    const shared = canShareMemory() ? new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3) : undefined;
    const state = shared ? new Int32Array(shared) : null;
    const pages: Blob[] = [];
    let total = 0;
    let frame = 0;

    const finish = (action: () => void) => {
      cancelAnimationFrame(frame);
      control.signal?.removeEventListener("abort", onAbort);
      worker.terminate();
      action();
    };
    const onAbort = () => {
      if (state) Atomics.store(state, SHARED_CANCEL, 1); // el worker lo lee entre página y página
      else finish(() => reject(new ImportCancelledError())); // sin memoria compartida: se detiene a la fuerza
    };
    control.signal?.addEventListener("abort", onAbort);

    // Con memoria compartida, la barra de avance se lee en cada frame, sin un mensaje por página.
    const tick = () => {
      if (state) control.onProgress?.(Atomics.load(state, SHARED_DONE), Atomics.load(state, SHARED_TOTAL));
      frame = requestAnimationFrame(tick);
    };
    if (state) frame = requestAnimationFrame(tick);

    worker.onmessage = (event: MessageEvent<CbzWorkerMessage>) => {
      const message = event.data;
      if (message.type === "total") total = message.total;
      else if (message.type === "page") {
        pages[message.index] = new Blob([message.bytes], { type: message.mime });
        if (!state) control.onProgress?.(message.index + 1, total);
      } else if (message.type === "done") finish(() => resolve(pages));
      else if (message.type === "cancelled") finish(() => reject(new ImportCancelledError()));
      else finish(() => reject(new ImportError(message.message)));
    };
    worker.onerror = () => finish(() => reject(new ImportError("No se pudo procesar el CBZ en segundo plano.")));

    const copy = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    worker.postMessage({ data: copy, shared }, [copy]);
  });
}
