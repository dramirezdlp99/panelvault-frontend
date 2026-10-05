import "server-only";

import { cookies } from "next/headers";

import { ACCESS_COOKIE, decodeProfile, PROFILE_COOKIE } from "./cookies";
import { readClaims, type SessionUser } from "./tokens";

/** Usuario actual para pintar la interfaz en componentes de servidor (no autoriza nada). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return decodeProfile(store.get(PROFILE_COOKIE)?.value) ?? readClaims(store.get(ACCESS_COOKIE)?.value)?.user ?? null;
}
