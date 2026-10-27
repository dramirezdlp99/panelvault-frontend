/** Mensajes del laboratorio entre el hilo principal y su worker. */
export type LabRequest =
  | { type: "primes"; limit: number; shared?: SharedArrayBuffer }
  | { type: "wait"; shared: SharedArrayBuffer }
  | { type: "guard"; shared: SharedArrayBuffer; channel: string; timeoutMs: number };

export type LabMessage =
  | { type: "primes-progress"; checked: number }
  | { type: "primes-done"; count: number; ms: number; cancelled: boolean }
  | { type: "waiting" }
  | { type: "woke"; ms: number }
  | { type: "guard-ready" };

/** Casillas del Int32Array compartido. */
export const SLOT_CANCEL = 0; // el hilo principal pide detener el cálculo del worker
export const SLOT_WAKE = 1; // despierta al worker dormido con Atomics.wait
export const SLOT_UNBLOCK = 2; // el worker libera al hilo principal bloqueado

export const LAB_CHANNEL = "panelvault-lab";
