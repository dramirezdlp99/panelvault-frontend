import { friendlyMessages } from "./messages";

/**
 * Cliente HTTP del navegador. Solo habla con el propio servidor de Next (/api/...),
 * nunca directamente con el backend: los tokens viven en cookies httpOnly.
 */

export type FieldError = { field: string; message: string };

/** Error con el formato del backend (código estable + mensaje en español). */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];
  /** Segundos de espera sugeridos por el servidor (cabecera Retry-After). */
  readonly retryAfterSeconds: number | null;

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = [], retryAfter: number | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfter;
  }
}

/** No hubo respuesta: sin conexión o el servidor no está disponible. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("No hay conexión con el servidor.", { cause });
    this.name = "NetworkError";
  }
}

/** Evento global que la app escucha para llevar al usuario a iniciar sesión. */
export const SESSION_EXPIRED_EVENT = "panelvault:session-expired";

export type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  body?: BodyInit;
  /** Si es false, un 401 no dispara el aviso de sesión vencida (útil en el propio login). */
  notifySessionExpired?: boolean;
};

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}

async function toError(response: Response): Promise<ApiRequestError> {
  const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "code" in data && "message" in data) {
    const d = data as { code: string; message: string; fieldErrors?: FieldError[] };
    return new ApiRequestError(response.status, d.code, d.message, d.fieldErrors ?? [], retryAfter);
  }
  return new ApiRequestError(response.status, "request.error", "La petición no pudo completarse.", [], retryAfter);
}

/** Petición con manejo uniforme de errores. Devuelve el JSON (o null en 204). */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { json, notifySessionExpired = true, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  let body = options.body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }
  finalHeaders.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: finalHeaders, body, credentials: "same-origin" });
  } catch (error) {
    throw new NetworkError(error);
  }

  if (!response.ok) {
    const error = await toError(response);
    if (response.status === 401 && notifySessionExpired && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }
  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Atajo para el BFF: api("/library/comics") → /api/pv/library/comics. */
export function api<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(`/api/pv${path.startsWith("/") ? path : `/${path}`}`, options);
}

/** Mensaje legible para mostrar en pantalla a partir de cualquier error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429 && error.retryAfterSeconds) {
      const minutes = Math.ceil(error.retryAfterSeconds / 60);
      return `Demasiados intentos. Intenta de nuevo en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
    }
    return friendlyMessages[error.code] ?? error.message;
  }
  if (error instanceof NetworkError) return "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  return "Ocurrió un error inesperado.";
}
