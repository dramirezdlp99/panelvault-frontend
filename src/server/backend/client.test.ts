// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ServerConfig } from "../config";
import { backendFetch, BackendUnavailableError } from "./client";
import { sign, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "./signature";

const signed: ServerConfig = { apiUrl: "http://backend:9096", gatewaySecret: "s".repeat(40), secureCookies: false };
const unsigned: ServerConfig = { ...signed, gatewaySecret: null };

afterEach(() => vi.unstubAllGlobals());

function captureFetch() {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response("{}", { status: 200 });
    }),
  );
  return calls;
}

describe("backendFetch", () => {
  it("firma la peticion con la ruta, el metodo y el cuerpo exacto", async () => {
    const calls = captureFetch();
    await backendFetch({ method: "put", path: "/api/v1/library/comics/1?x=2", json: { title: "Nemo" } }, signed);

    const { url, init } = calls[0];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("http://backend:9096/api/v1/library/comics/1?x=2");
    expect(init.method).toBe("PUT");
    const body = init.body as Uint8Array;
    expect(new TextDecoder().decode(body)).toBe('{"title":"Nemo"}');
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers[SIGNATURE_HEADER]).toBe(
      sign(signed.gatewaySecret!, headers[TIMESTAMP_HEADER], "PUT", "/api/v1/library/comics/1?x=2", body),
    );
  });

  it("no agrega firma si el gateway esta desactivado", async () => {
    const calls = captureFetch();
    await backendFetch({ path: "/api/v1/me" }, unsigned);
    expect(calls[0].init.headers).not.toHaveProperty(SIGNATURE_HEADER);
    expect(calls[0].init.body).toBeUndefined();
  });

  it("agrega el token de acceso como Bearer", async () => {
    const calls = captureFetch();
    await backendFetch({ path: "/api/v1/me", accessToken: "abc" }, unsigned);
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer abc");
  });

  it("envia bytes crudos con su tipo de contenido", async () => {
    const calls = captureFetch();
    await backendFetch({ method: "POST", path: "/api/v1/analysis/pages", body: new Uint8Array([1, 2]), contentType: "image/png" }, unsigned);
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe("image/png");
  });

  it("convierte un fallo de red en BackendUnavailableError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(backendFetch({ path: "/api/v1/me" }, unsigned)).rejects.toBeInstanceOf(BackendUnavailableError);
  });

  it("rechaza rutas relativas", async () => {
    await expect(backendFetch({ path: "api/v1/me" }, unsigned)).rejects.toThrow(/empezar por \//);
  });
});
