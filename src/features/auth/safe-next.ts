/** Solo rutas internas como destino tras el ingreso (evita redirecciones abiertas). */
export function safeNext(raw: string | null | undefined, fallback = "/biblioteca"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}
