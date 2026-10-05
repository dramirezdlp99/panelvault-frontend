import { api } from "@/shared/api/http";

export type TwoFactorStatus = { enabled: boolean; recoveryCodesRemaining: number };
export type TwoFactorSetup = { secret: string; otpauthUri: string };

export const getTwoFactorStatus = () => api<TwoFactorStatus>("/me/2fa");
export const beginTwoFactorSetup = () => api<TwoFactorSetup>("/me/2fa/setup", { method: "POST" });
export const confirmTwoFactor = (code: string) =>
  api<{ recoveryCodes: string[] }>("/me/2fa/confirm", { method: "POST", json: { code } });
export const disableTwoFactor = (code: string) => api<null>("/me/2fa/disable", { method: "POST", json: { code } });
