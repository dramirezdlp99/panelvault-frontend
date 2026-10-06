"use client";

import { useEffect } from "react";

export const WARM_UP_KEY = "panelvault-warm-up";

/**
 * Al abrir la app pide (una vez por pestaña) que el servidor despierte al backend.
 * No espera la respuesta ni muestra nada: solo adelanta el arranque mientras la persona lee.
 */
export function WarmUp() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(WARM_UP_KEY)) return;
      window.sessionStorage.setItem(WARM_UP_KEY, "1");
    } catch {
      // Almacenamiento bloqueado: se intenta de todas formas.
    }
    fetch("/api/health", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
