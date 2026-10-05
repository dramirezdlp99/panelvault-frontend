import { request } from "@/shared/api/http";

import type { SessionUser } from "@/shared/auth/roles";

export type LoginReply = { status: "AUTHENTICATED"; user: SessionUser | null } | { status: "TWO_FACTOR_REQUIRED" };

/** Las rutas /api/auth/* son del servidor de Next: guardan los tokens en cookies httpOnly. */
export function login(email: string, password: string): Promise<LoginReply> {
  return request<LoginReply>("/api/auth/login", {
    method: "POST",
    json: { email, password },
    notifySessionExpired: false,
  });
}

export function verifyTwoFactor(code: string): Promise<LoginReply> {
  return request<LoginReply>("/api/auth/2fa", { method: "POST", json: { code }, notifySessionExpired: false });
}

export function register(input: { email: string; displayName: string; password: string }): Promise<unknown> {
  return request("/api/auth/register", { method: "POST", json: input, notifySessionExpired: false });
}

export function logout(): Promise<null> {
  return request<null>("/api/auth/logout", { method: "POST", notifySessionExpired: false });
}
