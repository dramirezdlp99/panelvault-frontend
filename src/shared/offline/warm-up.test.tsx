import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WARM_UP_KEY, WarmUp } from "./warm-up";

describe("WarmUp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("despierta al backend una sola vez por pestana", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    const first = render(<WarmUp />);
    first.unmount();
    render(<WarmUp />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/health", { cache: "no-store" });
    expect(window.sessionStorage.getItem(WARM_UP_KEY)).toBe("1");
  });

  it("no rompe la pagina si la peticion falla", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));
    expect(() => render(<WarmUp />)).not.toThrow();
  });
});
