import { isRole, type SessionUser } from "@/shared/auth/roles";

export type { SessionUser };

/** Respuesta del backend al emitir tokens (TokenResponse en Spring). */
export type TokenPair = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

/** Respuesta del backend a /auth/login: tokens o reto de segundo factor. */
export type LoginResult =
  | ({ status: "AUTHENTICATED" } & TokenPair)
  | { status: "TWO_FACTOR_REQUIRED"; challengeToken: string; challengeExpiresAt: string };


type Claims = { sub?: unknown; role?: unknown; name?: unknown; exp?: unknown };

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Lee las afirmaciones del JWT SIN verificar la firma.
 * Solo sirve para decidir qué mostrar; quien autoriza de verdad es el backend,
 * que valida la firma en cada petición.
 */
export function readClaims(token: string | null | undefined): { user: SessionUser; expiresAtMs: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(decodeBase64Url(parts[1])) as Claims;
    const role = isRole(claims.role) ? claims.role : null;
    if (typeof claims.sub !== "string" || !role || typeof claims.exp !== "number") return null;
    const name = typeof claims.name === "string" && claims.name ? claims.name : "Lector";
    return { user: { id: claims.sub, name, role }, expiresAtMs: claims.exp * 1000 };
  } catch {
    return null;
  }
}

/** Margen para renovar antes del vencimiento real y no fallar a mitad de una petición. */
export const ACCESS_TOKEN_LEEWAY_MS = 30_000;

export function isAccessTokenFresh(token: string | null | undefined, nowMs: number = Date.now()): boolean {
  const claims = readClaims(token);
  return claims !== null && claims.expiresAtMs - ACCESS_TOKEN_LEEWAY_MS > nowMs;
}
