// @vitest-environment node
import { describe, expect, it } from "vitest";

import { tokenPair } from "@/test/jwt";

import {
  ACCESS_COOKIE,
  CHALLENGE_COOKIE,
  clearSessionCookies,
  decodeProfile,
  encodeProfile,
  PROFILE_COOKIE,
  REFRESH_COOKIE,
  writeChallengeCookie,
  writeTokenCookies,
  type CookieOptions,
} from "./cookies";

function jar() {
  const values = new Map<string, { value: string; options: CookieOptions }>();
  return { values, set: (name: string, value: string, options: CookieOptions) => values.set(name, { value, options }) };
}

describe("cookies de sesion", () => {
  const now = 1_700_000_000_000;

  it("guarda tokens httpOnly, SameSite=Lax y con vencimiento propio", () => {
    const target = jar();
    const tokens = tokenPair({ name: "Ana" }, now);
    const user = writeTokenCookies(target, tokens, true, now);

    const access = target.values.get(ACCESS_COOKIE)!;
    const refresh = target.values.get(REFRESH_COOKIE)!;
    expect(access.value).toBe(tokens.accessToken);
    expect(access.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900 });
    expect(refresh.options.maxAge).toBe(7 * 86_400);
    expect(user?.name).toBe("Ana");
    expect(decodeProfile(target.values.get(PROFILE_COOKIE)!.value)).toEqual(user);
  });

  it("borra todas las cookies con maxAge 0", () => {
    const target = jar();
    clearSessionCookies(target, false);
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PROFILE_COOKIE, CHALLENGE_COOKIE]) {
      expect(target.values.get(name)?.options.maxAge).toBe(0);
    }
  });

  it("el reto de 2FA solo viaja a las rutas de autenticacion", () => {
    const target = jar();
    writeChallengeCookie(target, "reto", new Date(now + 300_000).toISOString(), false, now);
    expect(target.values.get(CHALLENGE_COOKIE)?.options).toMatchObject({ path: "/api/auth", maxAge: 300 });
  });

  it("codifica y decodifica el perfil, y descarta valores manipulados", () => {
    const user = { id: "u", name: "José Ñandú", role: "LECTOR" as const };
    expect(decodeProfile(encodeProfile(user))).toEqual(user);
    expect(decodeProfile(Buffer.from(JSON.stringify({ ...user, role: "ROOT" })).toString("base64url"))).toBeNull();
    expect(decodeProfile("%%%")).toBeNull();
    expect(decodeProfile(undefined)).toBeNull();
  });
});
