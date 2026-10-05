import { THEME_INIT_SCRIPT } from "./theme";

/**
 * Inserta el script que aplica el tema guardado antes del primer pintado.
 * En el cliente se marca como text/plain para que React no lo ejecute de nuevo ni advierta.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
