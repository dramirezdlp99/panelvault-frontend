// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, tokenPair } from "@/test/jwt";

import { resetServerConfig } from "../config";
import { refreshOnce, resetRefreshState } from "./refresh";

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

describe("refreshOnce", () => {
  it("renueva una sola vez aunque lleguen varias peticiones a la vez", async () => {
    const tokens = tokenPair();
    const fetchMock = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return jsonResponse(tokens);
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all([refreshOnce("rt-1"), refreshOnce("rt-1"), refreshOnce("rt-1")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const result of results) expect(result).toEqual({ ok: true, tokens });
  });

  it("recuerda el resultado unos segundos para peticiones rezagadas", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(tokenPair()));
    vi.stubGlobal("fetch", fetchMock);
    await refreshOnce("rt-2");
    await refreshOnce("rt-2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tokens distintos se renuevan por separado", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(tokenPair()));
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([refreshOnce("a"), refreshOnce("b")]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("devuelve el error del backend sin lanzar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: 401, code: "auth.refresh_token_reused", message: "x" }, 401)),
    );
    const result = await refreshOnce("rt-3");
    expect(result).toEqual({ ok: false, error: { status: 401, code: "auth.refresh_token_reused", message: "x" } });
  });
});
