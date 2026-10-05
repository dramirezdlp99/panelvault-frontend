import { isRole } from "@/shared/auth/roles";

import { readClaims, type SessionUser, type TokenPair } from "./tokens";

/** Nombres de las cookies de sesión. Todas son httpOnly: JavaScript del navegador no puede leerlas. */
export const ACCESS_COOKIE = "pv_access";
export const REFRESH_COOKIE = "pv_refresh";
export const CHALLENGE_COOKIE = "pv_2fa";
/** Nombre y rol para pintar la interfaz; dura lo mismo que la sesión. No autoriza nada. */
export const PROFILE_COOKIE = "pv_profile";

export type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax" | "strict";
  path: string;
  maxAge: number;
};

/** Cualquier objeto con la API de cookies de Next (respuesta o petición). */
export type CookieWriter = {
  set(name: string, value: string, options: CookieOptions): unknown;
};

function secondsUntil(isoDate: string, nowMs: number): number {
  const ms = Date.parse(isoDate) - nowMs;
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
}

export function cookieOptions(secure: boolean, maxAge: number, path = "/"): CookieOptions {
  // SameSite=Lax: otro sitio no puede enviar peticiones POST con estas cookies (protección CSRF).
  return { httpOnly: true, secure, sameSite: "lax", path, maxAge };
}

export function encodeProfile(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function decodeProfile(value: string | null | undefined): SessionUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<SessionUser>;
    if (typeof parsed.id !== "string" || typeof parsed.name !== "string") return null;
    if (!isRole(parsed.role)) return null;
    return { id: parsed.id, name: parsed.name, role: parsed.role };
  } catch {
    return null;
  }
}

/** Guarda el par de tokens; cada cookie vence junto con su token. Devuelve el usuario leído del token. */
export function writeTokenCookies(
  target: CookieWriter,
  tokens: TokenPair,
  secure: boolean,
  nowMs = Date.now(),
): SessionUser | null {
  const refreshSeconds = secondsUntil(tokens.refreshTokenExpiresAt, nowMs);
  target.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(secure, secondsUntil(tokens.accessTokenExpiresAt, nowMs)));
  target.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(secure, refreshSeconds));
  const user = readClaims(tokens.accessToken)?.user ?? null;
  if (user) {
    target.set(PROFILE_COOKIE, encodeProfile(user), cookieOptions(secure, refreshSeconds));
  }
  return user;
}

/** Borra la sesión: una cookie con maxAge 0 se elimina en el navegador. */
export function clearSessionCookies(target: CookieWriter, secure: boolean): void {
  target.set(ACCESS_COOKIE, "", cookieOptions(secure, 0));
  target.set(REFRESH_COOKIE, "", cookieOptions(secure, 0));
  target.set(PROFILE_COOKIE, "", cookieOptions(secure, 0));
  target.set(CHALLENGE_COOKIE, "", cookieOptions(secure, 0, "/api/auth"));
}

/** El reto de 2FA vive en una cookie solo visible para las rutas de autenticación. */
export function writeChallengeCookie(target: CookieWriter, token: string, expiresAt: string, secure: boolean, nowMs = Date.now()) {
  target.set(CHALLENGE_COOKIE, token, cookieOptions(secure, secondsUntil(expiresAt, nowMs), "/api/auth"));
}

export function clearChallengeCookie(target: CookieWriter, secure: boolean): void {
  target.set(CHALLENGE_COOKIE, "", cookieOptions(secure, 0, "/api/auth"));
}
