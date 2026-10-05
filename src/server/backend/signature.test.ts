// @vitest-environment node
import { describe, expect, it } from "vitest";

import { canonicalMessage, sha256Hex, sign, signatureHeaders, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "./signature";

const SECRET = "secreto-de-prueba-0123456789abcdef";
const body = new TextEncoder().encode('{"page":3}');

describe("firma del gateway", () => {
  it("calcula el SHA-256 del cuerpo en hexadecimal", () => {
    expect(sha256Hex(body)).toBe("dc8efec71241ad626cc65885c1b99fdd6c23c8420f8bc184e8e8b65e2ef7716a");
  });

  it("arma el mensaje canonico igual que el backend", () => {
    expect(canonicalMessage("1760000000", "put", "/api/v1/x?y=1", body)).toBe(
      "1760000000\nPUT\n/api/v1/x?y=1\ndc8efec71241ad626cc65885c1b99fdd6c23c8420f8bc184e8e8b65e2ef7716a",
    );
  });

  // Vectores calculados con una implementación independiente (Python hmac/hashlib).
  it("coincide con un vector de referencia con cuerpo y query", () => {
    expect(sign(SECRET, "1760000000", "PUT", "/api/v1/reading/comics/abc/progress?x=1", body)).toBe(
      "7c2929f190985a38517ca11ee0cb82160b3b3dfa1c359c017fc80cf0a3aed800",
    );
  });

  it("coincide con un vector de referencia sin cuerpo", () => {
    expect(sign(SECRET, "1760000000", "GET", "/api/v1/me", new Uint8Array())).toBe(
      "9aabc9f1bd345d174668cd8e68d6e81858205cbb074f7aaf52f0bed8bf4a59f8",
    );
  });

  it("genera las cabeceras con la marca de tiempo en segundos", () => {
    const headers = signatureHeaders(SECRET, "GET", "/api/v1/me", new Uint8Array(), 1_760_000_000_999);
    expect(headers[TIMESTAMP_HEADER]).toBe("1760000000");
    expect(headers[SIGNATURE_HEADER]).toBe("9aabc9f1bd345d174668cd8e68d6e81858205cbb074f7aaf52f0bed8bf4a59f8");
  });

  it("cambiar la ruta o el cuerpo cambia la firma", () => {
    const base = sign(SECRET, "1", "POST", "/a", body);
    expect(sign(SECRET, "1", "POST", "/b", body)).not.toBe(base);
    expect(sign(SECRET, "1", "POST", "/a", new Uint8Array([1]))).not.toBe(base);
  });
});
