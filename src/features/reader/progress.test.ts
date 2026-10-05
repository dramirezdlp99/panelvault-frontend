// @vitest-environment node
import { describe, expect, it } from "vitest";

import { enqueue, pendingOps } from "@/shared/offline/outbox";
import type { LocalProgress } from "@/shared/offline/types";
import { freshDb } from "@/test/idb";

import { isNewer, mergeRemoteProgress, saveProgress, type RemoteProgress } from "./progress";

const local = (overrides: Partial<LocalProgress> = {}): LocalProgress => ({
  comicId: "c1",
  currentPage: 3,
  currentPanel: 1,
  guidedMode: true,
  totalPages: 10,
  clientUpdatedAt: "2026-10-01T10:00:00.000Z",
  deviceId: "aaa",
  ...overrides,
});
const remote = (overrides: Partial<RemoteProgress> = {}): RemoteProgress => ({
  ...local(),
  finished: false,
  percent: 30,
  serverUpdatedAt: "2026-10-01T10:00:01.000Z",
  ...overrides,
});

describe("isNewer (gana el último, igual que el backend)", () => {
  it("compara por fecha y desempata por dispositivo", () => {
    expect(isNewer(local({ clientUpdatedAt: "2026-10-02T00:00:00Z" }), local())).toBe(true);
    expect(isNewer(local({ clientUpdatedAt: "2026-09-30T00:00:00Z" }), local())).toBe(false);
    expect(isNewer(local({ deviceId: "bbb" }), local({ deviceId: "aaa" }))).toBe(true);
    expect(isNewer(local({ deviceId: "aaa" }), local({ deviceId: "bbb" }))).toBe(false);
    expect(isNewer(local(), undefined)).toBe(true);
  });
});

describe("saveProgress", () => {
  it("guarda en el dispositivo y solo deja el último envío pendiente", async () => {
    const db = await freshDb();
    await saveProgress(db, local({ currentPage: 2 }));
    await saveProgress(db, local({ currentPage: 4 }));
    expect((await db.get("progress", "c1"))?.currentPage).toBe(4);
    const ops = await pendingOps(db);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ method: "PUT", path: "/reading/comics/c1/progress" });
    expect(ops[0].body).toEqual({ currentPage: 4, currentPanel: 1, guidedMode: true, clientUpdatedAt: "2026-10-01T10:00:00.000Z", deviceId: "aaa" });
  });
});

describe("mergeRemoteProgress", () => {
  it("adopta el progreso más nuevo de otro dispositivo", async () => {
    const db = await freshDb();
    await db.put("progress", local());
    const adopted = await mergeRemoteProgress(db, remote({ currentPage: 8, clientUpdatedAt: "2026-10-03T00:00:00.000Z", deviceId: "zzz" }));
    expect(adopted?.currentPage).toBe(8);
    expect((await db.get("progress", "c1"))?.deviceId).toBe("zzz");
  });

  it("ignora el remoto si es más viejo", async () => {
    const db = await freshDb();
    await db.put("progress", local());
    expect(await mergeRemoteProgress(db, remote({ clientUpdatedAt: "2026-01-01T00:00:00Z" }))).toBeNull();
  });

  it("no pisa un progreso local pendiente de enviar", async () => {
    const db = await freshDb();
    await enqueue(db, { key: "progress:c1", method: "PUT", path: "/x", body: {} });
    expect(await mergeRemoteProgress(db, remote({ clientUpdatedAt: "2030-01-01T00:00:00Z" }))).toBeNull();
  });
});
