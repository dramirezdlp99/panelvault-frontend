import { NextResponse, type NextRequest } from "next/server";

import { BackendUnavailableError } from "../backend/client";
import { serverConfig } from "../config";
import { errorResponse } from "../http/responses";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  decodeProfile,
  PROFILE_COOKIE,
  REFRESH_COOKIE,
  writeTokenCookies,
} from "./cookies";
import { classifyPath, FORBIDDEN_PATH, LOGIN_PATH, type RouteKind } from "./gate";
import { refreshOnce } from "./refresh";
import { hasRole } from "@/shared/auth/roles";

import { isAccessTokenFresh, readClaims, type SessionUser } from "./tokens";

function deny(request: NextRequest, kind: RouteKind): NextResponse {
  const secure = serverConfig().secureCookies;
  if (kind === "api") {
    const reply = errorResponse({ status: 401, code: "auth.unauthenticated", message: "Inicia sesión para continuar." });
    clearSessionCookies(reply.cookies, secure);
    return reply;
  }
  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const reply = NextResponse.redirect(login);
  clearSessionCookies(reply.cookies, secure);
  return reply;
}

function proceed(request: NextRequest, kind: RouteKind, user: SessionUser | null): NextResponse {
  if (kind === "curator-page" && user && !hasRole(user, "CURADOR")) {
    // La página de curaduría no se muestra a lectores; el backend igual rechazaría sus peticiones.
    return NextResponse.rewrite(new URL(FORBIDDEN_PATH, request.url));
  }
  return NextResponse.next({ request: { headers: request.headers } });
}

/**
 * Lógica del proxy de Next para rutas privadas:
 * 1. Token de acceso vigente → sigue.
 * 2. Vencido pero hay token de renovación → renueva una sola vez y sigue con los nuevos.
 * 3. Sin sesión → al ingreso (páginas) o 401 (API).
 * Si el backend no responde se deja pasar: las pantallas offline-first funcionan sin él.
 */
export async function runProxy(request: NextRequest): Promise<NextResponse> {
  const kind = classifyPath(request.nextUrl.pathname);
  if (kind === "public") return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const knownUser = readClaims(access)?.user ?? decodeProfile(request.cookies.get(PROFILE_COOKIE)?.value);

  if (isAccessTokenFresh(access)) return proceed(request, kind, knownUser);
  if (!refresh) return deny(request, kind);

  try {
    const outcome = await refreshOnce(refresh);
    if (!outcome.ok) {
      return outcome.error.status === 401 ? deny(request, kind) : proceed(request, kind, knownUser);
    }

    // Los nuevos tokens se ponen en la petición (para el render actual) y en la respuesta (para el navegador).
    const secure = serverConfig().secureCookies;
    request.cookies.set(ACCESS_COOKIE, outcome.tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE, outcome.tokens.refreshToken);
    const user = readClaims(outcome.tokens.accessToken)?.user ?? knownUser;
    const reply = proceed(request, kind, user);
    writeTokenCookies(reply.cookies, outcome.tokens, secure);
    return reply;
  } catch (error) {
    if (error instanceof BackendUnavailableError) return proceed(request, kind, knownUser);
    throw error;
  }
}
