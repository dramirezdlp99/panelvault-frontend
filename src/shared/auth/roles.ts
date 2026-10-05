/** Roles del backend, de menor a mayor privilegio (ADMIN > CURADOR > LECTOR). */
export const ROLES = ["LECTOR", "CURADOR", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

/** Usuario tal como lo ve la interfaz: nombre y rol para pintar menús. No autoriza nada. */
export type SessionUser = { id: string; name: string; role: Role };

export const ROLE_LABELS: Record<Role, string> = {
  LECTOR: "Lector",
  CURADOR: "Curador",
  ADMIN: "Administrador",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Misma jerarquía que el backend. Solo decide qué mostrar en pantalla:
 * el backend vuelve a comprobar el rol en cada petición.
 */
export function hasRole(user: Pick<SessionUser, "role"> | null | undefined, required: Role): boolean {
  if (!user) return false;
  return ROLES.indexOf(user.role) >= ROLES.indexOf(required);
}
