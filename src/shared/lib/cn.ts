/** Une clases CSS ignorando valores vacíos, para componer variantes sin condicionales largos. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
