"use client";

import { useEffect } from "react";

/** Pantallas que deben abrir sin conexión (sus datos vienen de IndexedDB). */
export const OFFLINE_SHELLS = ["/biblioteca", "/biblioteca/detalle", "/lector", "/leyendo", "/marcadores"];

/**
 * Registra el service worker (solo en producción: en desarrollo estorbaría la recarga en caliente)
 * y le pide guardar las pantallas principales para usarlas sin conexión.
 */
export function ServiceWorkerRegistration({ warm = false }: { warm?: boolean }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        if (warm && navigator.onLine) registration.active?.postMessage({ type: "WARM", urls: OFFLINE_SHELLS });
      })
      .catch(() => undefined);
  }, [warm]);
  return null;
}

/** Al cerrar sesión se borran las páginas privadas guardadas. */
export function clearOfflinePages(): void {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_PAGES" });
  }
}
