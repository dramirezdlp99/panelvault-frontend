/*
 * Reglas iguales a las del backend (Email, DisplayName y PasswordPolicy en Spring).
 * Validar aquí da respuesta inmediata; el backend vuelve a validar porque nunca confía en el cliente.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_BYTES = 72;
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;
const EMAIL_FORMAT = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const MIN_LOCAL_PART_TO_CHECK = 4;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email);
  if (!value) return "Escribe tu correo.";
  if (value.length > 254 || !EMAIL_FORMAT.test(value)) return "El correo no tiene un formato válido.";
  return null;
}

export function validateDisplayName(name: string): string | null {
  const value = name.trim().replace(/\s+/g, " ");
  if ([...value].length < DISPLAY_NAME_MIN || [...value].length > DISPLAY_NAME_MAX) {
    return `El nombre debe tener entre ${DISPLAY_NAME_MIN} y ${DISPLAY_NAME_MAX} caracteres.`;
  }
  return null;
}

/** Lista de reglas incumplidas (vacía si la contraseña sirve). */
export function passwordProblems(password: string, email = ""): string[] {
  if (!password.trim()) return ["Escribe una contraseña."];
  const problems: string[] = [];
  if ([...password].length < PASSWORD_MIN_LENGTH) problems.push(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`);
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) problems.push("Es demasiado larga.");
  if (!/\p{L}/u.test(password)) problems.push("Incluye al menos una letra.");
  if (!/\p{Nd}/u.test(password)) problems.push("Incluye al menos un número.");
  const localPart = normalizeEmail(email).split("@")[0] ?? "";
  if (localPart.length >= MIN_LOCAL_PART_TO_CHECK && password.toLowerCase().includes(localPart)) {
    problems.push("No uses tu usuario de correo dentro de la contraseña.");
  }
  return problems;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** Fuerza orientativa para el medidor de 4 segmentos (la regla real es passwordProblems). */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Sin contraseña" };
  let score = 0;
  const length = [...password].length;
  if (length >= PASSWORD_MIN_LENGTH) score++;
  if (length >= 14) score++;
  if (/\p{L}/u.test(password) && /\p{Nd}/u.test(password)) score++;
  if (/[^\p{L}\p{Nd}]/u.test(password) || (/\p{Lu}/u.test(password) && /\p{Ll}/u.test(password))) score++;
  if (length < PASSWORD_MIN_LENGTH) score = Math.min(score, 1);
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"] as const;
  return { score: score as PasswordStrength["score"], label: labels[score] };
}
