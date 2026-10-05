import { notifyDbChanged, type LocalDb } from "./db";
import type { OutboxOp } from "./types";

export const OUTBOX_EVENT = "panelvault:outbox";

export type NewOp = Pick<OutboxOp, "key" | "method" | "path" | "body">;

/**
 * Agrega un cambio pendiente. Si ya había uno con la misma clave, se reemplaza:
 * por ejemplo, de diez actualizaciones de progreso solo se envía la última.
 */
export async function enqueue(db: LocalDb, op: NewOp, now: Date = new Date()): Promise<void> {
  const tx = db.transaction("outbox", "readwrite");
  const existing = await tx.store.index("byKey").getAllKeys(op.key);
  for (const key of existing) await tx.store.delete(key);
  await tx.store.add({ ...op, createdAt: now.toISOString(), attempts: 0, lastError: null });
  await tx.done;
  notifyDbChanged();
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OUTBOX_EVENT));
}

/** Pendientes en orden de llegada (el orden importa: crear antes que borrar). */
export function pendingOps(db: LocalDb): Promise<OutboxOp[]> {
  return db.getAll("outbox");
}

export function countPending(db: LocalDb): Promise<number> {
  return db.count("outbox");
}

export async function hasPendingFor(db: LocalDb, keyPrefix: string): Promise<boolean> {
  const all = await db.getAll("outbox");
  return all.some((op) => op.key.startsWith(keyPrefix));
}
