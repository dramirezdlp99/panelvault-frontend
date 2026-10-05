"use client";

import { useEffect, useState } from "react";

import type { LocalDb } from "@/shared/offline/db";

import { sha256Hex } from "@/features/library/import/hash";

import { loadPanelMap, panelsFromPayload, type DetectedPanel, type Preset } from "./panel-maps";

export type PanelMapState =
  | { status: "idle" }
  | { status: "loading"; detail?: string }
  | { status: "ready"; panels: DetectedPanel[] }
  | { status: "unavailable"; reason: string };

const shaCache = new WeakMap<Blob, Promise<string>>();

/** Huella de la imagen de una página (se calcula una vez por Blob). */
export function pageSha(blob: Blob): Promise<string> {
  let cached = shaCache.get(blob);
  if (!cached) {
    cached = blob.arrayBuffer().then((buffer) => sha256Hex(buffer));
    shaCache.set(blob, cached);
  }
  return cached;
}

const STATUS_TEXT: Record<string, string> = {
  PENDING: "En cola para el análisis…",
  RUNNING: "La IA está detectando las viñetas…",
  SUCCEEDED: "Listo",
};

/** Mapa de viñetas de una página: primero la caché local, luego el backend. */
export function usePanelMap(db: LocalDb | null, blob: Blob | undefined, preset: Preset, enabled: boolean): PanelMapState {
  const [state, setState] = useState<PanelMapState>({ status: "idle" });

  useEffect(() => {
    if (!db || !blob || !enabled) return;
    let active = true;
    // Empieza la carga del mapa (dato externo: IndexedDB o el backend).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    pageSha(blob)
      .then((sha) =>
        loadPanelMap(db, sha, blob, preset, undefined, {
          onStatus: (s) => active && setState({ status: "loading", detail: STATUS_TEXT[s] }),
        }),
      )
      .then((payload) => {
        if (!active) return;
        const panels = panelsFromPayload(payload);
        setState(panels.length > 0 ? { status: "ready", panels } : { status: "unavailable", reason: "No se detectaron viñetas en esta página." });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable", reason: navigator.onLine ? "No se pudo analizar la página." : "Sin conexión: esta página aún no se ha analizado." });
      });
    return () => {
      active = false;
    };
  }, [db, blob, preset, enabled]);

  return enabled ? state : { status: "idle" };
}
