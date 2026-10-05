import "server-only";

import { serverConfig, type ServerConfig } from "../config";
import { signatureHeaders } from "./signature";

export type BackendRequest = {
  method?: string;
  /** Ruta del backend, incluida la query si la hay (por ejemplo "/api/v1/library/comics?page=0"). */
  path: string;
  /** JSON (se serializa) o bytes crudos (imágenes). */
  json?: unknown;
  body?: Uint8Array;
  contentType?: string;
  accessToken?: string | null;
  /** Milisegundos antes de abandonar la petición. */
  timeoutMs?: number;
};

/** El backend no respondió (caído, dormido o sin red). */
export class BackendUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("El backend no está disponible", { cause });
    this.name = "BackendUnavailableError";
  }
}

const EMPTY = new Uint8Array(0);
const encoder = new TextEncoder();

/**
 * Llama al backend desde el servidor de Next.
 * - Firma cada petición con HMAC si hay secreto de gateway (el backend rechaza lo no firmado).
 * - Adjunta el token de acceso como Bearer cuando la ruta lo necesita.
 * - Nunca lanza por códigos HTTP de error: el llamador decide qué hacer con la respuesta.
 */
export async function backendFetch(request: BackendRequest, config: ServerConfig = serverConfig()): Promise<Response> {
  const method = (request.method ?? "GET").toUpperCase();
  if (!request.path.startsWith("/")) {
    throw new Error("La ruta del backend debe empezar por /");
  }

  let body: Uint8Array = EMPTY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (request.json !== undefined) {
    body = encoder.encode(JSON.stringify(request.json));
    headers["Content-Type"] = "application/json";
  } else if (request.body) {
    body = request.body;
    headers["Content-Type"] = request.contentType ?? "application/octet-stream";
  }

  if (request.accessToken) {
    headers.Authorization = `Bearer ${request.accessToken}`;
  }
  if (config.gatewaySecret) {
    Object.assign(headers, signatureHeaders(config.gatewaySecret, method, request.path, body));
  }

  try {
    return await fetch(config.apiUrl + request.path, {
      method,
      headers,
      body: body.length > 0 ? (body as BodyInit) : undefined,
      signal: AbortSignal.timeout(request.timeoutMs ?? 20_000),
      redirect: "manual",
      // Cada petición lleva una firma distinta: la caché, cuando hace falta, se maneja arriba (unstable_cache).
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendUnavailableError(error);
  }
}
