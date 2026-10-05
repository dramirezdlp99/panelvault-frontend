// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, tokenPair } from "@/test/jwt";

import { resetServerConfig } from "../config";
import { encodeProfile } from "./cookies";
import { login, logout, register, session, verifyTwoFactor } from "./handlers";

function post(path: string, body: unknown, cookies = "", headers: Record<string, string> = {}) {
  return new NextRequest(`http://app.test${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", ...(cookies ? { cookie: cookies } : {}), ...headers },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetServerConfig();
  vi.stubEnv("PANELVAULT_API_URL", "http://backend");
  vi.stubEnv("PANELVAULT_GATEWAY_SECRET", "");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const sentBody = (call = 0) => JSON.parse(new TextDecoder().decode(fetchMock.mock.calls[call][1].body as Uint8Array));

describe("login", () => {
  it("guarda los tokens en cookies y al navegador solo le devuelve el perfil", async () => {
    const tokens = tokenPair({ name: "Ana" });
    fetchMock.mockResolvedValue(jsonResponse({ status: "AUTHENTICATED", ...tokens }));

    const reply = await login(post("/api/auth/login", { email: "ana@x.com", password: "clave segura 1" }));
    const body = await reply.json();

    expect(reply.status).toBe(200);
    expect(body).toEqual({ status: "AUTHENTICATED", user: { id: expect.any(String), name: "Ana", role: "LECTOR" } });
    expect(JSON.stringify(body)).not.toContain(tokens.accessToken);
    expect(reply.cookies.get("pv_access")?.value).toBe(tokens.accessToken);
    expect(reply.cookies.get("pv_refresh")?.httpOnly).toBe(true);
    expect(reply.headers.get("cache-control")).toBe("no-store");
    expect(sentBody()).toEqual({ email: "ana@x.com", password: "clave segura 1" });
  });

  it("con 2FA guarda el reto en cookie y no entrega tokens", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: "TWO_FACTOR_REQUIRED", challengeToken: "reto", challengeExpiresAt: new Date(Date.now() + 300_000).toISOString() }),
    );
    const reply = await login(post("/api/auth/login", { email: "a@x.com", password: "p" }));
    expect((await reply.json()).status).toBe("TWO_FACTOR_REQUIRED");
    expect(reply.cookies.get("pv_2fa")?.value).toBe("reto");
    expect(reply.cookies.get("pv_access")).toBeUndefined();
  });

  it("valida los campos antes de llamar al backend", async () => {
    const reply = await login(post("/api/auth/login", { email: "" }));
    expect(reply.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reenvia el error del backend con Retry-After", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 429, code: "auth.too_many_attempts", message: "Espera" }, 429, { "Retry-After": "600" }));
    const reply = await login(post("/api/auth/login", { email: "a@x.com", password: "p" }));
    expect(reply.status).toBe(429);
    expect(reply.headers.get("retry-after")).toBe("600");
    expect((await reply.json()).code).toBe("auth.too_many_attempts");
  });

  it("responde 503 si el backend no esta disponible", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const reply = await login(post("/api/auth/login", { email: "a@x.com", password: "p" }));
    expect(reply.status).toBe(503);
    expect((await reply.json()).code).toBe("backend.unavailable");
  });

  it("rechaza peticiones de otro sitio", async () => {
    const reply = await login(post("/api/auth/login", { email: "a@x.com", password: "p" }, "", { "sec-fetch-site": "cross-site" }));
    expect(reply.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifyTwoFactor", () => {
  it("sin reto en cookie responde 401", async () => {
    const reply = await verifyTwoFactor(post("/api/auth/2fa", { code: "123456" }));
    expect(reply.status).toBe(401);
    expect((await reply.json()).code).toBe("auth.challenge_invalid");
  });

  it("envia el reto y el codigo; guarda los tokens y borra el reto", async () => {
    const tokens = tokenPair();
    fetchMock.mockResolvedValue(jsonResponse(tokens));
    const reply = await verifyTwoFactor(post("/api/auth/2fa", { code: "123456" }, "pv_2fa=reto"));
    expect(sentBody()).toEqual({ challengeToken: "reto", code: "123456" });
    expect(reply.cookies.get("pv_access")?.value).toBe(tokens.accessToken);
    expect(reply.cookies.get("pv_2fa")?.value).toBe("");
  });
});

describe("register", () => {
  it("crea la cuenta y responde 201", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "u", email: "a@x.com" }, 201));
    const reply = await register(post("/api/auth/register", { email: "a@x.com", displayName: " Ana ", password: "clave segura 1" }));
    expect(reply.status).toBe(201);
    expect(sentBody()).toEqual({ email: "a@x.com", displayName: "Ana", password: "clave segura 1" });
  });

  it("reenvia el correo duplicado como 409", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 409, code: "user.email_taken", message: "Ya existe" }, 409));
    const reply = await register(post("/api/auth/register", { email: "a@x.com", displayName: "Ana", password: "clave segura 1" }));
    expect(reply.status).toBe(409);
  });
});

describe("logout", () => {
  it("revoca el token en el backend y borra las cookies", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const reply = await logout(post("/api/auth/logout", {}, "pv_refresh=rt-1"));
    expect(reply.status).toBe(204);
    expect(sentBody()).toEqual({ refreshToken: "rt-1" });
    expect(reply.cookies.get("pv_refresh")?.value).toBe("");
  });

  it("cierra la sesion local aunque el backend no responda", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const reply = await logout(post("/api/auth/logout", {}, "pv_refresh=rt-1"));
    expect(reply.status).toBe(204);
  });
});

describe("session", () => {
  it("devuelve el perfil cuando hay sesion", async () => {
    const profile = encodeProfile({ id: "u", name: "Ana", role: "LECTOR" });
    const reply = session(new NextRequest("http://app.test/api/auth/session", { headers: { cookie: `pv_profile=${profile}; pv_refresh=rt` } }));
    expect(await reply.json()).toEqual({ user: { id: "u", name: "Ana", role: "LECTOR" } });
  });

  it("responde 401 sin sesion", () => {
    expect(session(new NextRequest("http://app.test/api/auth/session")).status).toBe(401);
  });
});
