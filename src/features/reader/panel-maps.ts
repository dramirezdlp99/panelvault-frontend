import { ApiRequestError, api } from "@/shared/api/http";
import type { LocalDb } from "@/shared/offline/db";

import type { NormalizedBox } from "./panel-viewport";
import { prepareForUpload } from "./prepare-upload";

export type Preset = "western" | "manga";
export type DetectedPanel = { order: number; confidence: number; bbox: NormalizedBox };

/** Resultado completo del motor de IA, guardado tal cual en el backend. */
export type AnalysisPayload = {
  engineVersion?: string;
  preset?: string;
  imageWidth?: number;
  imageHeight?: number;
  elapsedMs?: number;
  stages?: Record<string, number>;
  panelMap?: { direction?: string; pageType?: string; confidence?: number; panels?: Array<{ order: number; confidence: number; bbox: number[] }> };
};

export type AnalysisJob = {
  jobId: string;
  pageSha256: string;
  preset: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  result?: AnalysisPayload;
};

/** Formatos que acepta el motor de análisis. */
export const ANALYZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function presetFor(direction: "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT"): Preset {
  return direction === "RIGHT_TO_LEFT" ? "manga" : "western";
}

/** Viñetas válidas en orden de lectura (descarta rectángulos fuera de rango). */
export function panelsFromPayload(payload: AnalysisPayload | null | undefined): DetectedPanel[] {
  const raw = payload?.panelMap?.panels ?? [];
  return raw
    .filter((p) => Array.isArray(p.bbox) && p.bbox.length === 4 && p.bbox.every((n) => Number.isFinite(n)))
    .map((p) => ({ order: p.order, confidence: p.confidence, bbox: p.bbox as NormalizedBox }))
    .filter(({ bbox: [x, y, w, h] }) => w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= 1.0001 && y + h <= 1.0001)
    .sort((a, b) => a.order - b.order);
}

export type AnalysisApi = {
  getResult: (sha: string, preset: Preset) => Promise<{ result: AnalysisPayload }>;
  submit: (blob: Blob, preset: Preset) => Promise<{ status: number; body: AnalysisJob | { result: AnalysisPayload } }>;
  getJob: (jobId: string) => Promise<AnalysisJob>;
  sleep: (ms: number) => Promise<void>;
};

export const defaultAnalysisApi: AnalysisApi = {
  getResult: (sha, preset) => api(`/analysis/results/${sha}?preset=${preset}`),
  async submit(blob, preset) {
    // Una página muy pesada se reduce antes de subirla (límite por petición de Vercel).
    const upload = await prepareForUpload(blob);
    const response = await fetch(`/api/pv/analysis/pages?preset=${preset}`, {
      method: "POST",
      body: upload,
      headers: { "Content-Type": upload.type || "application/octet-stream" },
      credentials: "same-origin",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body as { code?: string; message?: string } | null;
      throw new ApiRequestError(response.status, error?.code ?? "analysis.error", error?.message ?? "No se pudo analizar la página.");
    }
    return { status: response.status, body: body as AnalysisJob | { result: AnalysisPayload } };
  },
  getJob: (jobId) => api(`/analysis/jobs/${encodeURIComponent(jobId)}`),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Obtiene el mapa de viñetas de una página:
 * 1. Caché local (IndexedDB) → funciona sin conexión.
 * 2. Resultado ya calculado en el backend (otra persona pudo analizar la misma página).
 * 3. Si no existe, se envía la página y se consulta el trabajo hasta que termine.
 */
export async function loadPanelMap(
  db: LocalDb,
  sha: string,
  blob: Blob,
  preset: Preset,
  client: AnalysisApi = defaultAnalysisApi,
  options: { pollMs?: number; maxPolls?: number; onStatus?: (status: string) => void } = {},
): Promise<AnalysisPayload | null> {
  const cached = await db.get("panelMaps", [sha, preset]);
  if (cached) return cached.result as AnalysisPayload;

  const save = async (result: AnalysisPayload) => {
    await db.put("panelMaps", { pageSha256: sha, preset, result, savedAt: new Date().toISOString() });
    return result;
  };

  try {
    const existing = await client.getResult(sha, preset);
    return save(existing.result);
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 404)) throw error;
  }

  if (!ANALYZABLE_TYPES.has(blob.type)) return null;

  options.onStatus?.("PENDING");
  const submitted = await client.submit(blob, preset);
  if ("result" in submitted.body && submitted.status === 200) return save(submitted.body.result as AnalysisPayload);

  const job = submitted.body as AnalysisJob;
  const pollMs = options.pollMs ?? 2000;
  for (let i = 0; i < (options.maxPolls ?? 90); i++) {
    await client.sleep(pollMs);
    const current = await client.getJob(job.jobId);
    options.onStatus?.(current.status);
    if (current.status === "SUCCEEDED" && current.result) return save(current.result);
    if (current.status === "FAILED") return null;
  }
  return null;
}
