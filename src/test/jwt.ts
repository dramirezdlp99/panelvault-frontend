/** Crea un JWT de prueba (firma falsa): el frontend solo lee sus datos, nunca lo valida. */
export function fakeJwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}.firma-de-prueba`;
}

export function accessTokenFor(
  user: { id?: string; name?: string; role?: string } = {},
  expiresInSeconds = 900,
  nowMs = Date.now(),
): string {
  return fakeJwt({
    sub: user.id ?? "11111111-1111-1111-1111-111111111111",
    name: user.name ?? "Ana Lectora",
    role: user.role ?? "LECTOR",
    exp: Math.floor(nowMs / 1000) + expiresInSeconds,
  });
}

export function tokenPair(user?: { id?: string; name?: string; role?: string }, nowMs = Date.now()) {
  return {
    tokenType: "Bearer",
    accessToken: accessTokenFor(user, 900, nowMs),
    expiresIn: 900,
    accessTokenExpiresAt: new Date(nowMs + 900_000).toISOString(),
    refreshToken: `refresh-${Math.random().toString(36).slice(2)}`,
    refreshTokenExpiresAt: new Date(nowMs + 7 * 86_400_000).toISOString(),
  };
}

/** Respuesta JSON como la que devolvería fetch. */
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
