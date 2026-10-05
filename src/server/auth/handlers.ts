import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { backendFetch, BackendUnavailableError } from "../backend/client";
import { serverConfig } from "../config";
import {
  forwardBackendError,
  readJson,
  stringField,
  unavailableResponse,
  validationError,
  errorResponse,
} from "../http/responses";
import { rejectCrossSite } from "../http/same-origin";
import {
  CHALLENGE_COOKIE,
  clearChallengeCookie,
  clearSessionCookies,
  decodeProfile,
  PROFILE_COOKIE,
  REFRESH_COOKIE,
  writeChallengeCookie,
  writeTokenCookies,
  ACCESS_COOKIE,
} from "./cookies";
import { readClaims, type LoginResult, type TokenPair } from "./tokens";

const NO_STORE = { "Cache-Control": "no-store" };

async function callBackend(path: string, json: unknown): Promise<{ response: Response; body: unknown }> {
  const response = await backendFetch({ method: "POST", path, json });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  return { response, body };
}

/** Respuesta de ingreso exitoso: los tokens van solo en cookies; al navegador le llega el perfil. */
function authenticated(tokens: TokenPair, secureCookies: boolean): NextResponse {
  const user = readClaims(tokens.accessToken)?.user ?? null;
  const reply = NextResponse.json({ status: "AUTHENTICATED", user }, { headers: NO_STORE });
  writeTokenCookies(reply.cookies, tokens, secureCookies);
  clearChallengeCookie(reply.cookies, secureCookies);
  return reply;
}

/** POST /api/auth/login: valida credenciales; guarda tokens o el reto de 2FA en cookies httpOnly. */
export async function login(request: NextRequest): Promise<NextResponse> {
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;

  const input = await readJson(request);
  const email = stringField(input, "email", 254);
  const password = stringField(input, "password", 128);
  if (!email || !password) {
    return validationError("Escribe tu correo y tu contraseña.");
  }

  try {
    const { response, body } = await callBackend("/api/v1/auth/login", { email, password });
    if (!response.ok) return forwardBackendError(response, body);

    const result = body as LoginResult;
    const { secureCookies } = serverConfig();
    if (result.status === "TWO_FACTOR_REQUIRED") {
      const reply = NextResponse.json(
        { status: result.status, challengeExpiresAt: result.challengeExpiresAt },
        { headers: NO_STORE },
      );
      writeChallengeCookie(reply.cookies, result.challengeToken, result.challengeExpiresAt, secureCookies);
      return reply;
    }

    return authenticated(result, secureCookies);
  } catch (error) {
    if (error instanceof BackendUnavailableError) return unavailableResponse();
    throw error;
  }
}

/** POST /api/auth/2fa: completa el ingreso con el código de la app autenticadora o de recuperación. */
export async function verifyTwoFactor(request: NextRequest): Promise<NextResponse> {
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;

  const challengeToken = request.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!challengeToken) {
    return errorResponse({
      status: 401,
      code: "auth.challenge_invalid",
      message: "La verificación expiró. Inicia sesión de nuevo.",
    });
  }

  const code = stringField(await readJson(request), "code", 20);
  if (!code) return validationError("Escribe el código de verificación.");

  try {
    const { response, body } = await callBackend("/api/v1/auth/2fa/verify", { challengeToken, code });
    if (!response.ok) return forwardBackendError(response, body);

    return authenticated(body as TokenPair, serverConfig().secureCookies);
  } catch (error) {
    if (error instanceof BackendUnavailableError) return unavailableResponse();
    throw error;
  }
}

/** POST /api/auth/register: crea la cuenta (el ingreso se hace después con /api/auth/login). */
export async function register(request: NextRequest): Promise<NextResponse> {
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;

  const input = await readJson(request);
  const email = stringField(input, "email", 254);
  const displayName = stringField(input, "displayName", 40);
  const password = stringField(input, "password", 128);
  if (!email || !displayName || !password) {
    return validationError("Completa nombre, correo y contraseña.");
  }

  try {
    const { response, body } = await callBackend("/api/v1/auth/register", { email, displayName, password });
    if (!response.ok) return forwardBackendError(response, body);
    return NextResponse.json(body, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof BackendUnavailableError) return unavailableResponse();
    throw error;
  }
}

/** POST /api/auth/logout: revoca el token de renovación en el backend y borra las cookies. */
export async function logout(request: NextRequest): Promise<NextResponse> {
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Si el backend no responde, igual se cierra la sesión en este navegador.
    await callBackend("/api/v1/auth/logout", { refreshToken }).catch(() => undefined);
  }
  const reply = new NextResponse(null, { status: 204, headers: NO_STORE });
  clearSessionCookies(reply.cookies, serverConfig().secureCookies);
  return reply;
}

/** GET /api/auth/session: quién está conectado, para que la interfaz se pinte. */
export function session(request: NextRequest): NextResponse {
  const user =
    decodeProfile(request.cookies.get(PROFILE_COOKIE)?.value) ??
    readClaims(request.cookies.get(ACCESS_COOKIE)?.value)?.user ??
    null;
  if (!user || !request.cookies.get(REFRESH_COOKIE)) {
    return errorResponse({ status: 401, code: "auth.unauthenticated", message: "No hay una sesión activa." });
  }
  return NextResponse.json({ user }, { headers: NO_STORE });
}
