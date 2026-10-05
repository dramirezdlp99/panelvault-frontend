"use client";

import { useEffect, useState } from "react";

import type { SessionUser } from "./roles";

/**
 * Pregunta al servidor si hay sesión, sin volver dinámicas las páginas públicas:
 * la portada sigue siendo estática y solo el encabezado se ajusta en el navegador.
 */
export function useSessionProbe(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { signal: controller.signal, credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<{ user: SessionUser }>) : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
    return () => controller.abort();
  }, []);
  return user;
}
