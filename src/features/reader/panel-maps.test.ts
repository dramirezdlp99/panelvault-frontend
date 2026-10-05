// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/shared/api/http";
import { freshDb } from "@/test/idb";

import { loadPanelMap, panelsFromPayload, presetFor, type AnalysisApi, type AnalysisPayload } from "./panel-maps";

const payload: AnalysisPayload = {
  panelMap: {
    panels: [
      { order: 2, confidence: 0.9, bbox: [0.5, 0, 0.5, 0.5] },
      { order: 1, confidence: 0.95, bbox: [0, 0, 0.5, 0.5] },
      { order: 3, confidence: 0.5, bbox: [0.2, 0.9, 0.5, 0.5] },
      { order: 4, confidence: 0.5, bbox: [0, 0, 0] },
    ],
  },
};

const png = new Blob(["imagen"], { type: "image/png" });
const notFound = () => Promise.reject(new ApiRequestError(404, "analysis.result_not_found", "x"));

function client(overrides: Partial<AnalysisApi> = {}): AnalysisApi {
  return {
    getResult: vi.fn(notFound),
    submit: vi.fn(async () => ({ status: 200, body: { result: payload } })),
    getJob: vi.fn(),
    sleep: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("panelsFromPayload", () => {
  it("ordena por orden de lectura y descarta rectángulos inválidos", () => {
    expect(panelsFromPayload(payload).map((p) => p.order)).toEqual([1, 2]);
    expect(panelsFromPayload(null)).toEqual([]);
  });

  it("elige el preset según la dirección", () => {
    expect(presetFor("RIGHT_TO_LEFT")).toBe("manga");
    expect(presetFor("LEFT_TO_RIGHT")).toBe("western");
  });
});

describe("loadPanelMap", () => {
  it("usa el resultado ya calculado en el backend y lo guarda para leer sin conexión", async () => {
    const db = await freshDb();
    const api = client({ getResult: vi.fn(async () => ({ result: payload })) });
    expect(await loadPanelMap(db, "sha", png, "western", api)).toEqual(payload);
    expect(api.submit).not.toHaveBeenCalled();
    // Segunda vez: sale de IndexedDB sin tocar la red.
    const offline = client({ getResult: vi.fn(async () => Promise.reject(new Error("sin red"))) });
    expect(await loadPanelMap(db, "sha", png, "western", offline)).toEqual(payload);
    expect(offline.getResult).not.toHaveBeenCalled();
  });

  it("si no existe, envía la página y espera el trabajo", async () => {
    const db = await freshDb();
    const statuses: string[] = [];
    const job = { jobId: "j1", pageSha256: "sha", preset: "manga", attempts: 0, createdAt: "" };
    const api = client({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi
        .fn()
        .mockResolvedValueOnce({ ...job, status: "RUNNING" })
        .mockResolvedValueOnce({ ...job, status: "SUCCEEDED", result: payload }),
    });
    expect(await loadPanelMap(db, "sha", png, "manga", api, { onStatus: (s) => statuses.push(s) })).toEqual(payload);
    expect(statuses).toEqual(["PENDING", "RUNNING", "SUCCEEDED"]);
    expect(await db.get("panelMaps", ["sha", "manga"])).toBeDefined();
  });

  it("devuelve null si el análisis falla o no termina a tiempo", async () => {
    const db = await freshDb();
    const job = { jobId: "j", pageSha256: "s", preset: "western", attempts: 1, createdAt: "" };
    const failed = client({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi.fn(async () => ({ ...job, status: "FAILED" as const })),
    });
    expect(await loadPanelMap(db, "s1", png, "western", failed)).toBeNull();
    const slow = client({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi.fn(async () => ({ ...job, status: "RUNNING" as const })),
    });
    expect(await loadPanelMap(db, "s2", png, "western", slow, { maxPolls: 3 })).toBeNull();
    expect(slow.getJob).toHaveBeenCalledTimes(3);
  });

  it("no envía formatos que el motor no acepta", async () => {
    const db = await freshDb();
    const api = client();
    expect(await loadPanelMap(db, "s", new Blob(["x"], { type: "image/gif" }), "western", api)).toBeNull();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it("propaga errores distintos de 'no encontrado'", async () => {
    const db = await freshDb();
    const api = client({ getResult: vi.fn(async () => Promise.reject(new ApiRequestError(503, "backend.unavailable", "x"))) });
    await expect(loadPanelMap(db, "s", png, "western", api)).rejects.toBeInstanceOf(ApiRequestError);
  });
});
