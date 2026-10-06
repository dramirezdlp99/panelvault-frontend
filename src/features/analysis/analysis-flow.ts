import { sha256Hex } from "@/features/library/import/hash";
import {
  ANALYZABLE_TYPES,
  defaultAnalysisApi,
  type AnalysisApi,
  type AnalysisJob,
  type AnalysisPayload,
  type Preset,
} from "@/features/reader/panel-maps";
import { prepareForUpload } from "@/features/reader/prepare-upload";

/** Límite del backend para imágenes de análisis. */
export const MAX_ANALYSIS_BYTES = 10 * 1024 * 1024;

export type AnalysisStep = "uploading" | "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type AnalysisUpdate = { step: AnalysisStep; attempts?: number; lastError?: string | null; jobId?: string };

export type AnalysisOutcome =
  | { kind: "done"; payload: AnalysisPayload; sha256: string; cached: boolean; jobId?: string }
  | { kind: "failed"; sha256: string; reason: string }
  | { kind: "timeout"; sha256: string; jobId: string };

export class InvalidImageError extends Error {}

export function validateImage(file: { type: string; size: number }): void {
  if (!ANALYZABLE_TYPES.has(file.type)) throw new InvalidImageError("Usa una imagen JPEG, PNG o WebP.");
  if (file.size === 0) throw new InvalidImageError("La imagen está vacía.");
  if (file.size > MAX_ANALYSIS_BYTES) throw new InvalidImageError("La imagen supera el máximo de 10 MB.");
}

/**
 * Envía una página al backend y sigue el trabajo hasta el final.
 * Si la misma imagen ya se analizó antes (con el mismo modo), el backend responde
 * de inmediato con el resultado guardado: "resultado de la caché".
 */
export async function runAnalysis(
  file: Blob,
  preset: Preset,
  onUpdate: (update: AnalysisUpdate) => void,
  client: AnalysisApi = defaultAnalysisApi,
  options: { pollMs?: number; maxPolls?: number } = {},
): Promise<AnalysisOutcome> {
  validateImage(file);
  // Se calcula la huella de lo que realmente se sube (puede ser la versión reducida),
  // para que coincida con la que guarda el backend.
  const upload = await prepareForUpload(file);
  const sha256 = await sha256Hex(await upload.arrayBuffer());

  onUpdate({ step: "uploading" });
  const submitted = await client.submit(upload, preset);
  if (submitted.status === 200 && "result" in submitted.body) {
    onUpdate({ step: "SUCCEEDED" });
    return { kind: "done", payload: submitted.body.result as AnalysisPayload, sha256, cached: true };
  }

  const job = submitted.body as AnalysisJob;
  onUpdate({ step: job.status, attempts: job.attempts, jobId: job.jobId });
  for (let i = 0; i < (options.maxPolls ?? 90); i++) {
    await client.sleep(options.pollMs ?? 1500);
    const current = await client.getJob(job.jobId);
    onUpdate({ step: current.status, attempts: current.attempts, lastError: current.lastError, jobId: job.jobId });
    if (current.status === "SUCCEEDED" && current.result) {
      return { kind: "done", payload: current.result, sha256, cached: false, jobId: job.jobId };
    }
    if (current.status === "FAILED") {
      return { kind: "failed", sha256, reason: current.lastError ?? "El motor no pudo analizar la página." };
    }
  }
  return { kind: "timeout", sha256, jobId: job.jobId };
}
