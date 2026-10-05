import { describe, expect, it } from "vitest";

import { hasRole, isRole } from "./roles";

describe("roles", () => {
  it("respeta la jerarquia ADMIN > CURADOR > LECTOR", () => {
    expect(hasRole({ role: "ADMIN" }, "CURADOR")).toBe(true);
    expect(hasRole({ role: "CURADOR" }, "CURADOR")).toBe(true);
    expect(hasRole({ role: "LECTOR" }, "CURADOR")).toBe(false);
    expect(hasRole({ role: "LECTOR" }, "LECTOR")).toBe(true);
    expect(hasRole(null, "LECTOR")).toBe(false);
  });

  it("reconoce solo los roles del backend", () => {
    expect(isRole("CURADOR")).toBe(true);
    expect(isRole("curador")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
