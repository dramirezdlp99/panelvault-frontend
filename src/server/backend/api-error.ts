/** Formato de error uniforme del backend (ApiError en Spring). */
export type ApiErrorBody = {
  status: number;
  code: string;
  message: string;
  path?: string;
  timestamp?: string;
  reference?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
};

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.status === "number" && typeof v.code === "string" && typeof v.message === "string";
}

/** Error genérico cuando la respuesta no trae el formato esperado. */
export function fallbackError(status: number, path?: string): ApiErrorBody {
  if (status === 401) {
    return { status, code: "auth.unauthenticated", message: "Tu sesión expiró. Inicia sesión de nuevo.", path };
  }
  if (status >= 500) {
    return { status, code: "server.error", message: "El servidor no pudo procesar la petición.", path };
  }
  return { status, code: "request.error", message: "La petición no pudo procesarse.", path };
}

export const BACKEND_UNAVAILABLE: ApiErrorBody = {
  status: 503,
  code: "backend.unavailable",
  message: "No se pudo contactar al servidor de PanelVault. Intenta de nuevo en unos segundos.",
};
