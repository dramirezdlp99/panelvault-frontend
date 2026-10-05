import "server-only";

import { createHash, createHmac } from "node:crypto";

/** Cabeceras que el backend espera en cada petición firmada (ver RequestSignatureVerifier). */
export const TIMESTAMP_HEADER = "X-PanelVault-Timestamp";
export const SIGNATURE_HEADER = "X-PanelVault-Signature";

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Mensaje que se firma. Debe ser idéntico, byte a byte, al que reconstruye el backend:
 * marca de tiempo, método en mayúsculas, ruta con su query y el SHA-256 del cuerpo.
 */
export function canonicalMessage(timestamp: string, method: string, pathAndQuery: string, body: Uint8Array): string {
  return `${timestamp}\n${method.toUpperCase()}\n${pathAndQuery}\n${sha256Hex(body)}`;
}

/** Firma HMAC-SHA256 en hexadecimal en minúsculas. */
export function sign(secret: string, timestamp: string, method: string, pathAndQuery: string, body: Uint8Array): string {
  return createHmac("sha256", secret).update(canonicalMessage(timestamp, method, pathAndQuery, body)).digest("hex");
}

/** Cabeceras de firma para una petición; la marca de tiempo va en segundos Unix. */
export function signatureHeaders(
  secret: string,
  method: string,
  pathAndQuery: string,
  body: Uint8Array,
  nowMs: number = Date.now(),
): Record<string, string> {
  const timestamp = String(Math.floor(nowMs / 1000));
  return {
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: sign(secret, timestamp, method, pathAndQuery, body),
  };
}
