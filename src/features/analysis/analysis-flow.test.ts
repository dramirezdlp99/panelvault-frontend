// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { AnalysisApi, AnalysisPayload } from "@/features/reader/panel-maps";

import { InvalidImageError, MAX_ANALYSIS_BYTES, runAnalysis, validateImage, type AnalysisUpdate } from "./analysis-flow";

const payload: AnalysisPayload = { engineVersion: "0.1.0", panelMap: { panels: [{ order: 1, confidence: 1, bbox: [0, 0, 1, 1] }] } };
const png = () => new Blob(["imagen"], { type: "image/png" });
const job = { jobId: "j1", pageSha256: "s", preset: "western", attempts: 1, createdAt: "" };

function api(overrides: Partial<AnalysisApi>): AnalysisApi {
  return { getResult: vi.fn(), submit: vi.fn(), getJob: vi.fn(), sleep: vi.fn(async () => {}), ...overrides };
}

describe("validateImage", () => {
  it("acepta JPEG, PNG y WebP de hasta 10 MB", () => {
    expect(() => validateImage({ type: "image/webp", size: 1000 })).not.toThrow();
    expect(() => validateImage({ type: "image/gif", size: 1000 })).toThrow(InvalidImageError);
    expect(() => validateImage({ type: "image/png", size: 0 })).toThrow("vacía");
    expect(() => validateImage({ type: "image/png", size: MAX_ANALYSIS_BYTES + 1 })).toThrow("10 MB");
  });
});

describe("runAnalysis", () => {
  it("marca como 'de la caché' cuando el backend ya tenía el resultado", async () => {
    const client = api({ submit: vi.fn(async () => ({ status: 200, body: { result: payload } })) });
    const outcome = await runAnalysis(png(), "western", () => {}, client);
    expect(outcome).toMatchObject({ kind: "done", cached: true, payload });
    expect(outcome.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("sigue el trabajo y reporta cada estado, incluidos los reintentos", async () => {
    const updates: AnalysisUpdate[] = [];
    const client = api({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi
        .fn()
        .mockResolvedValueOnce({ ...job, status: "RUNNING", attempts: 2, lastError: "motor dormido" })
        .mockResolvedValueOnce({ ...job, status: "SUCCEEDED", attempts: 2, result: payload }),
    });
    const outcome = await runAnalysis(png(), "manga", (u) => updates.push(u), client);
    expect(outcome).toMatchObject({ kind: "done", cached: false, jobId: "j1" });
    expect(updates.map((u) => u.step)).toEqual(["uploading", "PENDING", "RUNNING", "SUCCEEDED"]);
    expect(updates[2]).toMatchObject({ attempts: 2, lastError: "motor dormido" });
    expect(client.submit).toHaveBeenCalledWith(expect.any(Blob), "manga");
  });

  it("informa un trabajo fallido con su motivo", async () => {
    const client = api({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi.fn(async () => ({ ...job, status: "FAILED" as const, lastError: "Imagen ilegible" })),
    });
    expect(await runAnalysis(png(), "western", () => {}, client)).toMatchObject({ kind: "failed", reason: "Imagen ilegible" });
  });

  it("se rinde con 'timeout' si el trabajo no termina", async () => {
    const client = api({
      submit: vi.fn(async () => ({ status: 202, body: { ...job, status: "PENDING" as const } })),
      getJob: vi.fn(async () => ({ ...job, status: "RUNNING" as const })),
    });
    expect(await runAnalysis(png(), "western", () => {}, client, { maxPolls: 2 })).toMatchObject({ kind: "timeout", jobId: "j1" });
  });

  it("valida la imagen antes de enviarla", async () => {
    const client = api({ submit: vi.fn() });
    await expect(runAnalysis(new Blob(["x"], { type: "text/plain" }), "western", () => {}, client)).rejects.toBeInstanceOf(InvalidImageError);
    expect(client.submit).not.toHaveBeenCalled();
  });
});
