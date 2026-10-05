import { describe, expect, it } from "vitest";

import { routes } from "./routes";

describe("routes", () => {
  it("construye la ruta de una obra del catalogo", () => {
    expect(routes.catalogWork("krazy-kat")).toBe("/catalogo/krazy-kat");
  });

  it("codifica caracteres peligrosos del slug", () => {
    expect(routes.catalogWork("a/b?c")).toBe("/catalogo/a%2Fb%3Fc");
  });
});
