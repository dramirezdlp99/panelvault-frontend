import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, oppositeTheme, parseTheme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme";

describe("tema", () => {
  it("el modo claro es el predeterminado", () => {
    expect(DEFAULT_THEME).toBe("light");
  });

  it("acepta solo valores validos", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it.each([null, undefined, "", "azul", "DARK"])("convierte %s en el tema predeterminado", (value) => {
    expect(parseTheme(value)).toBe("light");
  });

  it("calcula el tema contrario", () => {
    expect(oppositeTheme("light")).toBe("dark");
    expect(oppositeTheme("dark")).toBe("light");
  });

  it("el script inicial aplica el tema guardado antes de pintar", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("el script inicial ignora valores manipulados", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "<script>");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
