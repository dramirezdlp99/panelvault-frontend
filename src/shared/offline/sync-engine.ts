import { ApiRequestError, NetworkError } from "@/shared/api/http";

import type { LocalDb } from "./db";
import type { OutboxOp } from "./types";

/** Envía una operación al backend; lanza ApiRequestError o NetworkError si falla. */
export type Sender = (op: OutboxOp) => Promise<unknown>;

export type FlushResult = {
  sent: number;
  /** Operaciones descartadas porque el backend las rechazó definitivamente. */
  dropped: Array<{ op: OutboxOp; reason: string }>;
  /** Por qué se detuvo antes de terminar (sin red o sesión vencida). */
  stoppedBy: "network" | "session" | "server" | null;
  remaining: number;
};

type Decision = "done" | "drop" | "stop-network" | "stop-session" | "stop-server";

/** Qué hacer con una operación según cómo respondió el backend. */
export function decide(op: OutboxOp, error: unknown): Decision {
  if (error instanceof NetworkError) return "stop-network";
  if (!(error instanceof ApiRequestError)) return "stop-server";
  if (error.status === 401) return "stop-session";
  if (error.status === 404 && op.method === "DELETE") return "done";
  if (error.status === 429 || error.status >= 500) return "stop-server";
  return "drop";
}

/**
 * Vacía la bandeja de salida en orden. Cada operación es idempotente (PUT con ids del cliente,
 * DELETE que tolera 404, progreso con "gana el último"), así que reintentar nunca duplica nada.
 */
export async function flushOutbox(db: LocalDb, send: Sender): Promise<FlushResult> {
  const result: FlushResult = { sent: 0, dropped: [], stoppedBy: null, remaining: 0 };
  const ops = await db.getAll("outbox");

  for (const op of ops) {
    let decision: Decision;
    try {
      await send(op);
      decision = "done";
    } catch (error) {
      decision = decide(op, error);
      if (decision === "drop") result.dropped.push({ op, reason: error instanceof Error ? error.message : "Rechazada" });
      if (decision.startsWith("stop")) {
        await db.put("outbox", { ...op, attempts: op.attempts + 1, lastError: error instanceof Error ? error.message : null });
      }
    }

    if (decision === "done" || decision === "drop") {
      // Solo se borra si nadie la reemplazó mientras se enviaba (misma id todavía presente).
      await db.delete("outbox", op.id!);
      if (decision === "done") result.sent++;
      continue;
    }
    result.stoppedBy = decision === "stop-network" ? "network" : decision === "stop-session" ? "session" : "server";
    break;
  }

  result.remaining = await db.count("outbox");
  return result;
}
