// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";

import { resetServerConfig } from "../config";
import { backendPathFor, forwardToBackend, MAX_FORWARD_BODY_BYTES, translateLocation } from "./forward";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetServerConfig();
  revalidateTag.mockReset();
  vi.stubEnv("PANELVAULT_API_URL", "http://backend");
  vi.stubEnv("PANELVAULT_GATEWAY_SECRET", "");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function req(path: string, init: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {}) {
  return new NextRequest(`http://app.test${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: { cookie: "pv_access=tok", "sec-fetch-site": "same-origin", ...init.headers },
  });
}

describe("backendPathFor", () => {
  it("traduce rutas permitidas conservando la query", () => {
    expect(backendPathFor(["library", "comics"], "?q=nemo&page=1")).toBe("/api/v1/library/comics?q=nemo&page=1");
  });

  it("codifica los segmentos", () => {
    expect(backendPathFor(["analysis", "results", "a b"], "")).toBe("/api/v1/analysis/results/a%20b");
  });

  it.each([[["admin", "users"]], [["auth", "login"]], [[]], [["library", ".."]], [["library", "a/b"]]])(
    "rechaza %j",
    (segments) => {
      expect(backendPathFor(segments, "")).toBeNull();
    },
  );
});

describe("translateLocation", () => {
  it("convierte la ubicacion del backend a la ruta del BFF", () => {
    expect(translateLocation("/api/v1/analysis/jobs/123")).toBe("/api/pv/analysis/jobs/123");
    expect(translateLocation("https://otro.com/x")).toBeNull();
    expect(translateLocation(null)).toBeNull();
  });
});

describe("forwardToBackend", () => {
  it("reenvia con el token de la cookie y devuelve la respuesta sin cache", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    const reply = await forwardToBackend(req("/api/pv/library/comics?page=0"), ["library", "comics"]);
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend/api/v1/library/comics?page=0");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    expect(reply.status).toBe(200);
    expect(reply.headers.get("cache-control")).toBe("no-store");
    expect(await reply.json()).toEqual({ items: [] });
  });

  it("traduce Location y conserva Retry-After", async () => {
    fetchMock.mockResolvedValue(
      new Response("{}", { status: 202, headers: { Location: "/api/v1/analysis/jobs/9", "Retry-After": "5", "Content-Type": "application/json" } }),
    );
    const reply = await forwardToBackend(
      req("/api/pv/analysis/pages", { method: "POST", body: new Uint8Array([1, 2, 3]), headers: { "content-type": "image/png" } }),
      ["analysis", "pages"],
    );
    expect(reply.status).toBe(202);
    expect(reply.headers.get("location")).toBe("/api/pv/analysis/jobs/9");
    expect(reply.headers.get("retry-after")).toBe("5");
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("image/png");
  });

  it("borra la sesion si el backend responde 401", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, code: "auth.invalid_token", message: "x" }, 401));
    const reply = await forwardToBackend(req("/api/pv/me"), ["me"]);
    expect(reply.status).toBe(401);
    expect(reply.cookies.get("pv_access")?.value).toBe("");
  });

  it("invalida el catalogo cacheado tras un cambio de curaduria", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "w" }));
    await forwardToBackend(req("/api/pv/curation/works/w/publish", { method: "POST" }), ["curation", "works", "w", "publish"]);
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
  });

  it("no invalida el catalogo en lecturas de curaduria", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await forwardToBackend(req("/api/pv/curation/works"), ["curation", "works"]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rechaza mutaciones de otro sitio", async () => {
    const reply = await forwardToBackend(
      req("/api/pv/library/comics/1", { method: "DELETE", headers: { "sec-fetch-site": "cross-site" } }),
      ["library", "comics", "1"],
    );
    expect(reply.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos demasiado grandes sin leerlos completos", async () => {
    const reply = await forwardToBackend(
      req("/api/pv/analysis/pages", { method: "POST", body: "x", headers: { "content-length": String(MAX_FORWARD_BODY_BYTES + 1) } }),
      ["analysis", "pages"],
    );
    expect(reply.status).toBe(413);
  });

  it("responde 404 para rutas no permitidas", async () => {
    const reply = await forwardToBackend(req("/api/pv/admin/users"), ["admin", "users"]);
    expect(reply.status).toBe(404);
  });

  it("responde 503 si el backend no contesta", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const reply = await forwardToBackend(req("/api/pv/me"), ["me"]);
    expect(reply.status).toBe(503);
  });
});
