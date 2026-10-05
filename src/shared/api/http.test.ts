import { afterEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";

import { api, ApiRequestError, errorMessage, NetworkError, request, SESSION_EXPIRED_EVENT } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("request", () => {
  it("envia JSON y devuelve el cuerpo", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/api/x", { method: "POST", json: { a: 1 } })).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(init.credentials).toBe("same-origin");
  });

  it("devuelve null en 204", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(request("/api/x")).resolves.toBeNull();
  });

  it("convierte el error del servidor en ApiRequestError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: 400, code: "request.validation_failed", message: "Campos", fieldErrors: [{ field: "email", message: "x" }] }, 400),
      ),
    );
    const error = await request("/api/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 400, code: "request.validation_failed", fieldErrors: [{ field: "email", message: "x" }] });
  });

  it("lee Retry-After en segundos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 429, code: "auth.too_many_attempts", message: "x" }, 429, { "Retry-After": "61" })));
    const error = (await request("/api/x").catch((e: unknown) => e)) as ApiRequestError;
    expect(error.retryAfterSeconds).toBe(61);
    expect(errorMessage(error)).toBe("Demasiados intentos. Intenta de nuevo en 2 minutos.");
  });

  it("avisa a la app cuando la sesion vence", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: 401, code: "auth.unauthenticated", message: "x" }, 401)));
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    await request("/api/x").catch(() => null);
    await request("/api/x", { notifySessionExpired: false }).catch(() => null);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("un fallo de red se convierte en NetworkError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(request("/api/x")).rejects.toBeInstanceOf(NetworkError);
  });

  it("api() antepone el prefijo del BFF", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await api("library/comics");
    await api("/me");
    expect(fetchMock.mock.calls.map((c) => (c as unknown[])[0])).toEqual(["/api/pv/library/comics", "/api/pv/me"]);
  });
});

describe("errorMessage", () => {
  it("usa el mensaje con tildes para codigos conocidos", () => {
    expect(errorMessage(new ApiRequestError(401, "auth.invalid_credentials", "Correo o contrasena incorrectos"))).toBe(
      "Correo o contraseña incorrectos.",
    );
  });

  it("usa el mensaje del servidor para codigos desconocidos", () => {
    expect(errorMessage(new ApiRequestError(400, "otro.codigo", "Mensaje del servidor"))).toBe("Mensaje del servidor");
  });

  it("explica la falta de conexion y los errores inesperados", () => {
    expect(errorMessage(new NetworkError())).toMatch(/Sin conexión/);
    expect(errorMessage(new Error("x"))).toBe("Ocurrió un error inesperado.");
  });
});
