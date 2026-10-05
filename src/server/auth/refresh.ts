import { isApiErrorBody, type ApiErrorBody, fallbackError } from "../backend/api-error";
import { backendFetch } from "../backend/client";
import { sha256Hex } from "../backend/signature";
import type { TokenPair } from "./tokens";

export type RefreshOutcome = { ok: true; tokens: TokenPair } | { ok: false; error: ApiErrorBody };

/** Cuánto se recuerda el resultado de una renovación para las peticiones que llegaron a la vez. */
const RESULT_TTL_MS = 15_000;

const inFlight = new Map<string, Promise<RefreshOutcome>>();
const recent = new Map<string, { outcome: RefreshOutcome; at: number }>();

async function callBackend(refreshToken: string): Promise<RefreshOutcome> {
  const response = await backendFetch({ method: "POST", path: "/api/v1/auth/refresh", json: { refreshToken } });
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return { ok: true, tokens: body as TokenPair };
  return { ok: false, error: isApiErrorBody(body) ? body : fallbackError(response.status) };
}

/**
 * Renueva los tokens UNA sola vez aunque lleguen varias peticiones simultáneas con el mismo
 * token de renovación. El backend rota el token y, si ve uno ya usado, revoca toda la sesión
 * (detección de reutilización); sin esta coordinación, abrir dos pestañas cerraría la sesión.
 */
export function refreshOnce(refreshToken: string, nowMs: number = Date.now()): Promise<RefreshOutcome> {
  const key = sha256Hex(refreshToken);

  const remembered = recent.get(key);
  if (remembered && nowMs - remembered.at < RESULT_TTL_MS) {
    return Promise.resolve(remembered.outcome);
  }

  const running = inFlight.get(key);
  if (running) return running;

  const promise = callBackend(refreshToken)
    .then((outcome) => {
      recent.set(key, { outcome, at: Date.now() });
      return outcome;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);

  // Limpieza perezosa para que el mapa no crezca sin límite.
  for (const [k, v] of recent) {
    if (nowMs - v.at >= RESULT_TTL_MS) recent.delete(k);
  }
  return promise;
}

/** Solo para pruebas: olvida el estado compartido. */
export function resetRefreshState(): void {
  inFlight.clear();
  recent.clear();
}
