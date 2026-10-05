import { describe, expect, it } from "vitest";

import { groupSecret, recoveryCodesFile } from "./format";

describe("formato de seguridad", () => {
  it("agrupa la clave en bloques de 4", () => {
    expect(groupSecret("JBSWY3DPEHPK3PXP")).toBe("JBSW Y3DP EHPK 3PXP");
    expect(groupSecret("ABCDEF")).toBe("ABCD EF");
  });

  it("genera el archivo de codigos numerado", () => {
    const text = recoveryCodesFile(["AAA", "BBB"], new Date("2026-10-05T00:00:00Z"));
    expect(text).toContain("Generados: 2026-10-05T00:00:00.000Z");
    expect(text).toContain("01. AAA");
    expect(text).toContain("02. BBB");
  });
});
