// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";

import { resetServerConfig } from "../config";

// unstable_cache se reemplaza por una función directa: aquí se prueba la lógica, no la caché de Next.
const cacheOptions = vi.hoisted(() => [] as unknown[]);
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown, _key: unknown, options: unknown) => {
    cacheOptions.push(options);
    return fn;
  },
}));

const { loadPublishedSlugs, loadWork, loadWorks } = await import("./catalog-data");

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

describe("datos del catalogo", () => {
  it("cachea 60 segundos con la etiqueta catalog", () => {
    expect(cacheOptions).toContainEqual({ revalidate: 60, tags: ["catalog"] });
  });

  it("pide la pagina con busqueda y tamano fijo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], page: 1, size: 12, totalItems: 0, totalPages: 0 }));
    const result = await loadWorks("  nemo  ", 1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend/api/v1/catalog/works?page=1&size=12&q=nemo");
    expect(result.kind).toBe("ok");
  });

  it("normaliza paginas negativas o decimales", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await loadWorks("", -3.5);
    expect(fetchMock.mock.calls[0][0]).toContain("page=0");
  });

  it("distingue obra inexistente de backend caido", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, code: "catalog.work_not_found", message: "x" }, 404));
    expect(await loadWork("nada")).toEqual({ kind: "not-found" });

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await loadWork("x")).toEqual({ kind: "unavailable" });

    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 500, code: "server.error", message: "x" }, 500));
    expect(await loadWork("x")).toEqual({ kind: "unavailable" });
  });

  it("codifica el slug en la ruta", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ slug: "a" }));
    await loadWork("a/../b");
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend/api/v1/catalog/works/a%2F..%2Fb");
  });

  it("sin backend la compilacion sigue con cero fichas pregeneradas", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await loadPublishedSlugs()).toEqual([]);
    fetchMock.mockResolvedValue(jsonResponse(["krazy-kat"]));
    expect(await loadPublishedSlugs()).toEqual(["krazy-kat"]);
  });
});
