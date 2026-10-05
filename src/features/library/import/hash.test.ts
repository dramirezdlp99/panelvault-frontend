// @vitest-environment node
import { describe, expect, it } from "vitest";

import { fingerprintOfParts, sha256Hex } from "./hash";

describe("hash", () => {
  it("calcula SHA-256 conocido", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("la huella de varias imágenes depende del contenido y del orden", async () => {
    const a = new TextEncoder().encode("a").buffer;
    const b = new TextEncoder().encode("b").buffer;
    expect(await fingerprintOfParts([a, b])).toBe(await fingerprintOfParts([a, b]));
    expect(await fingerprintOfParts([a, b])).not.toBe(await fingerprintOfParts([b, a]));
    expect(await fingerprintOfParts([a, b])).toMatch(/^[0-9a-f]{64}$/);
  });
});
