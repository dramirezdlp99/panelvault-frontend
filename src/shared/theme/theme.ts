export type Theme = "light" | "dark";

/** Clave de localStorage donde se recuerda la preferencia del usuario. */
export const THEME_STORAGE_KEY = "panelvault-theme";

/** El modo claro es el predeterminado del diseño. */
export const DEFAULT_THEME: Theme = "light";

/** Convierte cualquier valor guardado en un tema válido; lo desconocido vuelve al predeterminado. */
export function parseTheme(value: string | null | undefined): Theme {
  return value === "dark" || value === "light" ? value : DEFAULT_THEME;
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/**
 * Script en línea que se ejecuta en <head> antes de pintar la página: aplica el tema
 * guardado y evita el "parpadeo" de modo claro a oscuro al recargar.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
