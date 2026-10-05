// @vitest-environment node
import { describe, expect, it } from "vitest";

import { classifyPath } from "./gate";

describe("classifyPath", () => {
  it.each([
    ["/", "public"],
    ["/catalogo", "public"],
    ["/ingresar", "public"],
    ["/bibliotecas", "public"],
    ["/biblioteca", "page"],
    ["/biblioteca/123", "page"],
    ["/lector/abc", "page"],
    ["/seguridad", "page"],
    ["/curaduria", "curator-page"],
    ["/curaduria/nueva", "curator-page"],
    ["/api/pv/library/comics", "api"],
    ["/api/auth/session", "api"],
    ["/api/auth/login", "public"],
  ])("%s es %s", (path, kind) => {
    expect(classifyPath(path)).toBe(kind);
  });
});
