// @vitest-environment node
import { describe, expect, it } from "vitest";

import { readServerConfig } from "./config";

describe("readServerConfig", () => {
  it("usa el backend local por defecto y sin firma", () => {
    const config = readServerConfig({});
    expect(config.apiUrl).toBe("http://localhost:9096");
    expect(config.gatewaySecret).toBeNull();
  });

  it("quita las barras finales de la URL", () => {
    expect(readServerConfig({ PANELVAULT_API_URL: "https://api.example.com///" }).apiUrl).toBe("https://api.example.com");
  });

  it("rechaza URLs sin protocolo", () => {
    expect(() => readServerConfig({ PANELVAULT_API_URL: "api.example.com" })).toThrow(/http/);
  });

  it("exige un secreto de gateway de al menos 32 caracteres", () => {
    expect(() => readServerConfig({ PANELVAULT_GATEWAY_SECRET: "corto" })).toThrow(/32/);
    expect(readServerConfig({ PANELVAULT_GATEWAY_SECRET: "x".repeat(32) }).gatewaySecret).toBe("x".repeat(32));
  });

  it("usa cookies Secure en produccion y permite forzarlo", () => {
    expect(readServerConfig({ NODE_ENV: "production" }).secureCookies).toBe(true);
    expect(readServerConfig({ NODE_ENV: "development" }).secureCookies).toBe(false);
    expect(readServerConfig({ NODE_ENV: "production", PANELVAULT_SECURE_COOKIES: "false" }).secureCookies).toBe(false);
    expect(readServerConfig({ NODE_ENV: "development", PANELVAULT_SECURE_COOKIES: "true" }).secureCookies).toBe(true);
  });
});
