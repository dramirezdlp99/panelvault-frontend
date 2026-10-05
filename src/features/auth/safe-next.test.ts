import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("acepta rutas internas", () => {
    expect(safeNext("/lector/abc?pagina=2")).toBe("/lector/abc?pagina=2");
  });

  it.each([undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/a\nb"])(
    "usa el destino por defecto ante %j",
    (value) => {
      expect(safeNext(value)).toBe("/biblioteca");
    },
  );
});
