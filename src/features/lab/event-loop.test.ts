import { describe, expect, it } from "vitest";

import { busyBlock, runEventLoopDemo } from "./event-loop";

describe("Event Loop", () => {
  it("ejecuta lo sincrono, luego las microtasks y despues la task", async () => {
    const steps = (await runEventLoopDemo()).filter((s) => s.kind !== "frame");
    expect(steps.map((s) => s.kind)).toEqual(["sync", "sync", "microtask", "microtask", "task"]);
    expect(steps[2].label).toContain("Promise.then");
    expect(steps[3].label).toContain("queueMicrotask");
  });

  it("el bloqueo se corta cuando otra parte lo pide", () => {
    let calls = 0;
    const ms = busyBlock(5000, () => ++calls > 1000);
    expect(ms).toBeLessThan(5000);
  });
});
