// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError, NetworkError } from "@/shared/api/http";
import { freshDb } from "@/test/idb";

import { enqueue, pendingOps } from "./outbox";
import { decide, flushOutbox } from "./sync-engine";
import type { OutboxOp } from "./types";

const op = (method: OutboxOp["method"]): OutboxOp => ({ key: "k", method, path: "/x", body: null, createdAt: "", attempts: 0, lastError: null });
const apiError = (status: number) => new ApiRequestError(status, "x", "x");

describe("decide", () => {
  it.each([
    [new NetworkError(), "PUT", "stop-network"],
    [apiError(401), "PUT", "stop-session"],
    [apiError(404), "DELETE", "done"],
    [apiError(404), "PUT", "drop"],
    [apiError(400), "PUT", "drop"],
    [apiError(409), "PUT", "drop"],
    [apiError(429), "PUT", "stop-server"],
    [apiError(503), "PUT", "stop-server"],
    [new Error("raro"), "PUT", "stop-server"],
  ] as const)("%s en %s → %s", (error, method, expected) => {
    expect(decide(op(method), error)).toBe(expected);
  });
});

describe("flushOutbox", () => {
  it("envia en orden y vacia la bandeja", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "a", method: "PUT", path: "/1", body: {} });
    await enqueue(db, { key: "b", method: "DELETE", path: "/2", body: null });
    const send = vi.fn().mockResolvedValue({});
    const result = await flushOutbox(db, send);
    expect(send.mock.calls.map((c) => c[0].path)).toEqual(["/1", "/2"]);
    expect(result).toMatchObject({ sent: 2, remaining: 0, stoppedBy: null });
  });

  it("se detiene sin red y conserva lo pendiente con el intento registrado", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "a", method: "PUT", path: "/1", body: {} });
    await enqueue(db, { key: "b", method: "PUT", path: "/2", body: {} });
    const send = vi.fn().mockRejectedValue(new NetworkError());
    const result = await flushOutbox(db, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ sent: 0, remaining: 2, stoppedBy: "network" });
    expect((await pendingOps(db))[0].attempts).toBe(1);
  });

  it("descarta lo que el backend rechaza y sigue con lo demas", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "a", method: "PUT", path: "/malo", body: {} });
    await enqueue(db, { key: "b", method: "PUT", path: "/bueno", body: {} });
    const send = vi.fn(async (o: OutboxOp) => {
      if (o.path === "/malo") throw apiError(400);
      return {};
    });
    const result = await flushOutbox(db, send);
    expect(result.sent).toBe(1);
    expect(result.dropped.map((d) => d.op.path)).toEqual(["/malo"]);
    expect(result.remaining).toBe(0);
  });

  it("un borrado de algo que ya no existe cuenta como hecho", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "a", method: "DELETE", path: "/x", body: null });
    const result = await flushOutbox(db, vi.fn().mockRejectedValue(apiError(404)));
    expect(result).toMatchObject({ sent: 1, remaining: 0 });
  });

  it("con la sesion vencida se detiene sin perder nada", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "a", method: "PUT", path: "/x", body: {} });
    const result = await flushOutbox(db, vi.fn().mockRejectedValue(apiError(401)));
    expect(result).toMatchObject({ stoppedBy: "session", remaining: 1 });
  });
});
