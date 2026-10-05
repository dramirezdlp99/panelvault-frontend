"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/cn";

import { oppositeTheme, parseTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

/* El tema vive en el atributo data-theme de <html>; este "store" lo observa. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return parseTheme(document.documentElement.getAttribute("data-theme"));
}

function serverTheme(): Theme {
  return "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Navegación privada o almacenamiento bloqueado: el cambio vale solo para esta visita.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const next = oppositeTheme(theme);
  const label = next === "dark" ? "Activar modo oscuro" : "Activar modo claro";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface text-ink shadow-hard-sm press",
        className,
      )}
    >
      {theme === "dark" ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}
