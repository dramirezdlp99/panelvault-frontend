import { notifyDbChanged, type LocalDb } from "@/shared/offline/db";
import { enqueue, hasPendingFor } from "@/shared/offline/outbox";
import type { LocalProgress } from "@/shared/offline/types";

/** Progreso según el backend (ProgressResponse en Spring). */
export type RemoteProgress = {
  comicId: string;
  currentPage: number;
  totalPages: number;
  currentPanel: number;
  guidedMode: boolean;
  finished: boolean;
  percent: number;
  clientUpdatedAt: string;
  deviceId: string;
  serverUpdatedAt: string;
};

export const progressPath = (comicId: string) => `/reading/comics/${encodeURIComponent(comicId)}/progress`;

/** Guarda el progreso en el dispositivo y encola el envío (solo viaja el último). */
export async function saveProgress(db: LocalDb, progress: LocalProgress): Promise<void> {
  await db.put("progress", progress);
  await enqueue(db, {
    key: `progress:${progress.comicId}`,
    method: "PUT",
    path: progressPath(progress.comicId),
    body: {
      currentPage: progress.currentPage,
      currentPanel: progress.currentPanel,
      guidedMode: progress.guidedMode,
      clientUpdatedAt: progress.clientUpdatedAt,
      deviceId: progress.deviceId,
    },
  });
}

/**
 * "Gana el último en escribir", con el mismo desempate que el backend: a igual hora,
 * gana el deviceId mayor. Así todos los dispositivos llegan al mismo resultado.
 */
export function isNewer(candidate: Pick<LocalProgress, "clientUpdatedAt" | "deviceId">, current: Pick<LocalProgress, "clientUpdatedAt" | "deviceId"> | undefined): boolean {
  if (!current) return true;
  const a = Date.parse(candidate.clientUpdatedAt);
  const b = Date.parse(current.clientUpdatedAt);
  if (a !== b) return a > b;
  return candidate.deviceId > current.deviceId;
}

/** Adopta el progreso del servidor si es más nuevo y aquí no hay un cambio pendiente de enviar. */
export async function mergeRemoteProgress(db: LocalDb, remote: RemoteProgress): Promise<LocalProgress | null> {
  if (await hasPendingFor(db, `progress:${remote.comicId}`)) return null;
  const local = await db.get("progress", remote.comicId);
  if (!isNewer(remote, local)) return null;
  const adopted: LocalProgress = {
    comicId: remote.comicId,
    currentPage: remote.currentPage,
    currentPanel: remote.currentPanel,
    guidedMode: remote.guidedMode,
    totalPages: remote.totalPages,
    clientUpdatedAt: remote.clientUpdatedAt,
    deviceId: remote.deviceId,
  };
  await db.put("progress", adopted);
  notifyDbChanged();
  return adopted;
}
