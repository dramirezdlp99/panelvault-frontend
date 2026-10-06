import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const backendFetch = vi.fn();
vi.mock("@/server/backend/client", async () => {
  const actual = await vi.importActual<typeof import("@/server/backend/client")>("@/server/backend/client");
  return { ...actual, backendFetch: (...args: unknown[]) => backendFetch(...args) };
});

const { GET } = await import("./route");
const { BackendUnavailableError } = await import("@/server/backend/client");

describe("GET /api/health", () => {
  afterEach(() => backendFetch.mockReset());

  it("consulta la salud del backend y responde ok", async () => {
    backendFetch.mockResolvedValue(new Response("{}", { status: 200 }));
    const response = await GET();
    expect(backendFetch).toHaveBeenCalledWith({ path: "/actuator/health" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("responde 503 si el backend contesta con error", async () => {
    backendFetch.mockResolvedValue(new Response("{}", { status: 500 }));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "degraded" });
  });

  it("responde 503 si el backend no esta disponible", async () => {
    backendFetch.mockRejectedValue(new BackendUnavailableError());
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "down" });
  });
});
