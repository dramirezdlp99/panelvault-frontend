import "server-only";

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, clearSessionCookies } from "../auth/cookies";
import { CATALOG_TAG } from "../cache-tags";
import { serverConfig } from "../config";
import { errorResponse, unavailableResponse } from "../http/responses";
import { rejectCrossSite } from "../http/same-origin";
import { backendFetch, BackendUnavailableError } from "./client";

/** Primer segmento permitido: el navegador solo alcanza estas áreas del backend a través de Next. */
export const ALLOWED_ROOTS = new Set(["library", "reading", "analysis", "me", "curation"]);

/** Imagen de análisis (10 MB en el backend) más margen para cabeceras de multipartes. */
export const MAX_FORWARD_BODY_BYTES = 12 * 1024 * 1024;

const SAFE_METHODS = new Set(["GET", "HEAD"]);

/** Ruta del backend a partir de los segmentos de /api/pv/...; null si no está permitida. */
export function backendPathFor(segments: string[], search: string): string | null {
  if (segments.length === 0 || !ALLOWED_ROOTS.has(segments[0])) return null;
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/") || s.includes("\\"))) return null;
  return `/api/v1/${segments.map(encodeURIComponent).join("/")}${search}`;
}

/** Location del backend traducida al espacio de rutas del frontend. */
export function translateLocation(location: string | null): string | null {
  if (!location) return null;
  return location.startsWith("/api/v1/") ? `/api/pv/${location.slice("/api/v1/".length)}` : null;
}

async function readLimitedBody(request: NextRequest): Promise<Uint8Array | "too-large"> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_FORWARD_BODY_BYTES) return "too-large";
  const buffer = new Uint8Array(await request.arrayBuffer());
  return buffer.length > MAX_FORWARD_BODY_BYTES ? "too-large" : buffer;
}

/**
 * Backend-for-Frontend: reenvía /api/pv/* al backend con el token de la cookie httpOnly
 * y la firma del gateway. El navegador nunca ve el token ni conoce la URL del backend.
 */
export async function forwardToBackend(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const path = backendPathFor(segments, request.nextUrl.search);
  if (!path) {
    return errorResponse({ status: 404, code: "resource.not_found", message: "Ruta no encontrada." });
  }

  if (!SAFE_METHODS.has(method)) {
    const rejected = rejectCrossSite(request);
    if (rejected) return rejected;
  }

  let body: Uint8Array | undefined;
  if (!SAFE_METHODS.has(method)) {
    const read = await readLimitedBody(request);
    if (read === "too-large") {
      return errorResponse({ status: 413, code: "request.too_large", message: "El archivo es demasiado grande." });
    }
    body = read;
  }

  let response: Response;
  try {
    response = await backendFetch({
      method,
      path,
      body,
      contentType: request.headers.get("content-type") ?? undefined,
      accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    });
  } catch (error) {
    if (error instanceof BackendUnavailableError) return unavailableResponse();
    throw error;
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["content-type", "retry-after"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  const location = translateLocation(response.headers.get("location"));
  if (location) headers.set("location", location);

  const payload = response.status === 204 ? null : await response.arrayBuffer();
  const reply = new NextResponse(payload, { status: response.status, headers });

  if (response.status === 401) {
    // El backend ya no acepta la sesión (revocada o vencida): se limpia para forzar un nuevo ingreso.
    clearSessionCookies(reply.cookies, serverConfig().secureCookies);
  }
  if (response.ok && segments[0] === "curation" && !SAFE_METHODS.has(method)) {
    // Un cambio de curaduría vuelve obsoleto el catálogo público cacheado. Con expire: 0 la
    // siguiente visita ya ve el cambio (no se sirve la versión vieja mientras se regenera).
    revalidateTag(CATALOG_TAG, { expire: 0 });
  }
  return reply;
}
