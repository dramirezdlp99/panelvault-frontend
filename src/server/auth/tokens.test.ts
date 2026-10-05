// @vitest-environment node
import { describe, expect, it } from "vitest";

import { accessTokenFor, fakeJwt } from "@/test/jwt";

import { isAccessTokenFresh, readClaims } from "./tokens";

describe("readClaims", () => {
  it("lee usuario, rol y vencimiento del token", () => {
    const token = accessTokenFor({ id: "u-1", name: "Ana", role: "CURADOR" }, 600, 1_000_000_000_000);
    expect(readClaims(token)).toEqual({
      user: { id: "u-1", name: "Ana", role: "CURADOR" },
      expiresAtMs: 1_000_000_000_000 + 600_000,
    });
  });

  it("devuelve null para tokens vacios o mal formados", () => {
    expect(readClaims(null)).toBeNull();
    expect(readClaims("no-es-un-jwt")).toBeNull();
    expect(readClaims("a.%%%.c")).toBeNull();
  });

  it("rechaza roles desconocidos y tokens sin sujeto", () => {
    expect(readClaims(fakeJwt({ sub: "u", role: "SUPERUSUARIO", exp: 9e9 }))).toBeNull();
    expect(readClaims(fakeJwt({ role: "LECTOR", exp: 9e9 }))).toBeNull();
  });

  it("usa un nombre por defecto si el token no lo trae", () => {
    expect(readClaims(fakeJwt({ sub: "u", role: "LECTOR", exp: 9e9 }))?.user.name).toBe("Lector");
  });
});

describe("isAccessTokenFresh", () => {
  const now = 1_700_000_000_000;

  it("es vigente con mas de 30 segundos de margen", () => {
    expect(isAccessTokenFresh(accessTokenFor({}, 120, now), now)).toBe(true);
  });

  it("se considera vencido dentro del margen de 30 segundos", () => {
    expect(isAccessTokenFresh(accessTokenFor({}, 20, now), now)).toBe(false);
  });

  it("sin token no hay sesion vigente", () => {
    expect(isAccessTokenFresh(undefined, now)).toBe(false);
  });
});
