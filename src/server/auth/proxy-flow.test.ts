// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { accessTokenFor, jsonResponse, tokenPair } from "@/test/jwt";

import { resetServerConfig } from "../config";
import { encodeProfile } from "./cookies";
import { runProxy } from "./proxy-flow";
import { resetRefreshState } from "./refresh";

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest(`http://app.test${path}`, { headers: cookie ? { cookie } : {} });
}

beforeEach(() => {
  resetRefreshState();
  resetServerConfig();
  vi.stubEnv("PANELVAULT_API_URL", "http://backend");
  vi.stubEnv("PANELVAULT_GATEWAY_SECRET", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("runProxy", () => {
  it("no toca las rutas publicas", async () => {
    const reply = await runProxy(request("/catalogo"));
    expect(reply.headers.get("x-middleware-next")).toBe("1");
  });

  it("deja pasar con un token de acceso vigente", async () => {
    const reply = await runProxy(request("/biblioteca", { pv_access: accessTokenFor() }));
    expect(reply.headers.get("x-middleware-next")).toBe("1");
  });

  it("sin sesion manda la pagina al ingreso recordando el destino", async () => {
    const reply = await runProxy(request("/lector/abc?pagina=3"));
    expect(reply.status).toBe(307);
    expect(reply.headers.get("location")).toBe("http://app.test/ingresar?next=%2Flector%2Fabc%3Fpagina%3D3");
  });

  it("sin sesion la API responde 401 en JSON", async () => {
    const reply = await runProxy(request("/api/pv/library/comics"));
    expect(reply.status).toBe(401);
    expect(await reply.json()).toMatchObject({ code: "auth.unauthenticated" });
  });

  it("con el token vencido renueva y entrega cookies nuevas", async () => {
    const tokens = tokenPair({ name: "Ana" });
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(tokens)));
    const reply = await runProxy(request("/biblioteca", { pv_access: accessTokenFor({}, -10), pv_refresh: "rt" }));

    expect(reply.headers.get("x-middleware-next")).toBe("1");
    expect(reply.cookies.get("pv_access")?.value).toBe(tokens.accessToken);
    expect(reply.cookies.get("pv_refresh")?.value).toBe(tokens.refreshToken);
    // El render actual también ve el token nuevo.
    expect(reply.headers.get("x-middleware-request-cookie") ?? reply.headers.get("x-middleware-override-headers")).toBeTruthy();
  });

  it("si la renovacion es rechazada cierra la sesion", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 401, code: "auth.refresh_token_reused", message: "x" }, 401)));
    const reply = await runProxy(request("/biblioteca", { pv_refresh: "rt" }));
    expect(reply.status).toBe(307);
    expect(reply.cookies.get("pv_refresh")?.value).toBe("");
  });

  it("si el backend no responde deja pasar (la biblioteca funciona sin red)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const reply = await runProxy(request("/biblioteca", { pv_refresh: "rt" }));
    expect(reply.headers.get("x-middleware-next")).toBe("1");
  });

  it("un lector que entra a curaduria ve la pagina sin permiso", async () => {
    const reply = await runProxy(request("/curaduria", { pv_access: accessTokenFor({ role: "LECTOR" }) }));
    expect(reply.headers.get("x-middleware-rewrite")).toBe("http://app.test/sin-permiso");
  });

  it("un curador entra a curaduria", async () => {
    const reply = await runProxy(request("/curaduria", { pv_access: accessTokenFor({ role: "CURADOR" }) }));
    expect(reply.headers.get("x-middleware-next")).toBe("1");
  });

  it("un administrador hereda el permiso de curador", async () => {
    const profile = encodeProfile({ id: "u", name: "Admin", role: "ADMIN" });
    const reply = await runProxy(request("/curaduria", { pv_access: accessTokenFor({ role: "ADMIN" }), pv_profile: profile }));
    expect(reply.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
