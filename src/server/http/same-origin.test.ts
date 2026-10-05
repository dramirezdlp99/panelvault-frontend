// @vitest-environment node
import { describe, expect, it } from "vitest";

import { isCrossSiteRequest } from "./same-origin";

const req = (headers: Record<string, string>) => new Request("http://app.test/api/auth/login", { method: "POST", headers });

describe("isCrossSiteRequest", () => {
  it("acepta peticiones del mismo origen segun Sec-Fetch-Site", () => {
    expect(isCrossSiteRequest(req({ "sec-fetch-site": "same-origin" }))).toBe(false);
  });

  it("rechaza peticiones de otro sitio segun Sec-Fetch-Site", () => {
    expect(isCrossSiteRequest(req({ "sec-fetch-site": "cross-site" }))).toBe(true);
    expect(isCrossSiteRequest(req({ "sec-fetch-site": "same-site" }))).toBe(true);
  });

  it("compara Origin con el host cuando no hay Sec-Fetch-Site", () => {
    expect(isCrossSiteRequest(req({ origin: "http://app.test", host: "app.test" }))).toBe(false);
    expect(isCrossSiteRequest(req({ origin: "https://evil.example", host: "app.test" }))).toBe(true);
  });

  it("respeta el host original detras de un proxy", () => {
    expect(isCrossSiteRequest(req({ origin: "https://panelvault.app", host: "10.0.0.5:3000", "x-forwarded-host": "panelvault.app" }))).toBe(false);
  });

  it("deja pasar clientes que no son navegadores (no llevan cookies ajenas)", () => {
    expect(isCrossSiteRequest(req({}))).toBe(false);
  });
});
