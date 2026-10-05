import { NextResponse } from "next/server";

import { BACKEND_UNAVAILABLE, fallbackError, isApiErrorBody, type ApiErrorBody } from "../backend/api-error";

/** Respuesta JSON de error con el mismo formato que usa el backend. */
export function errorResponse(error: ApiErrorBody, headers?: HeadersInit): NextResponse {
  return NextResponse.json(error, { status: error.status, headers });
}

export function unavailableResponse(): NextResponse {
  return errorResponse(BACKEND_UNAVAILABLE);
}

export function validationError(message: string, fieldErrors?: ApiErrorBody["fieldErrors"]): NextResponse {
  return errorResponse({ status: 400, code: "request.validation_failed", message, fieldErrors });
}

/** Reenvía un error del backend conservando su código, mensaje y la cabecera Retry-After. */
export function forwardBackendError(response: Response, body: unknown): NextResponse {
  const error = isApiErrorBody(body) ? body : fallbackError(response.status);
  const headers: Record<string, string> = {};
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) headers["Retry-After"] = retryAfter;
  return errorResponse({ ...error, status: response.status }, headers);
}

/** Lee el cuerpo JSON de una petición; devuelve null si no es JSON válido. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function stringField(body: Record<string, unknown> | null, name: string, maxLength: number): string | null {
  const value = body?.[name];
  if (typeof value !== "string") return null;
  const trimmed = name === "password" ? value : value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}
