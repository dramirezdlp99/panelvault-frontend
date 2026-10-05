// @vitest-environment node
import { describe, expect, it } from "vitest";

import { freshDb } from "@/test/idb";

import { countPending, enqueue, hasPendingFor, pendingOps } from "./outbox";

describe("bandeja de salida", () => {
  it("guarda las operaciones en orden de llegada", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "comic:1", method: "PUT", path: "/a", body: { n: 1 } });
    await enqueue(db, { key: "comic:2", method: "DELETE", path: "/b", body: null });
    const ops = await pendingOps(db);
    expect(ops.map((o) => o.path)).toEqual(["/a", "/b"]);
    expect(ops[0]).toMatchObject({ attempts: 0, lastError: null });
  });

  it("una operacion con la misma clave reemplaza a la anterior", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "progress:1", method: "PUT", path: "/p", body: { page: 1 } });
    await enqueue(db, { key: "progress:1", method: "PUT", path: "/p", body: { page: 7 } });
    const ops = await pendingOps(db);
    expect(ops).toHaveLength(1);
    expect(ops[0].body).toEqual({ page: 7 });
    expect(await countPending(db)).toBe(1);
  });

  it("indica si hay pendientes para un prefijo", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "comic:abc", method: "PUT", path: "/x", body: {} });
    expect(await hasPendingFor(db, "comic:abc")).toBe(true);
    expect(await hasPendingFor(db, "comic:zzz")).toBe(false);
  });
});
