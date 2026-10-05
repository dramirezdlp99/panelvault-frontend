/**
 * Clasificación de rutas para el proxy de Next (antes llamado middleware).
 * Es una comprobación optimista para la experiencia de usuario: redirige al ingreso
 * a quien no tiene sesión. La autorización real la hace el backend en cada petición.
 */
export type RouteKind = "public" | "page" | "curator-page" | "api";

export const PROTECTED_PAGE_PREFIXES = [
  "/biblioteca",
  "/lector",
  "/leyendo",
  "/marcadores",
  "/analisis",
  "/seguridad",
] as const;

export const CURATOR_PAGE_PREFIXES = ["/curaduria"] as const;

export const API_PREFIXES = ["/api/pv", "/api/auth/session"] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function classifyPath(pathname: string): RouteKind {
  if (API_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "api";
  if (CURATOR_PAGE_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "curator-page";
  if (PROTECTED_PAGE_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "page";
  return "public";
}

export const LOGIN_PATH = "/ingresar";
export const FORBIDDEN_PATH = "/sin-permiso";
