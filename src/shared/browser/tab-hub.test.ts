import { describe, expect, it, vi } from "vitest";

import { TabHub, type TabMessage } from "./tab-hub";

/** BroadcastChannel falso: entrega a los demás canales con el mismo nombre. */
function fakeChannels() {
  const all: FakeChannel[] = [];
  class FakeChannel {
    onmessage: ((e: MessageEvent) => void) | null = null;
    constructor(readonly name: string) {
      all.push(this);
    }
    postMessage(data: unknown) {
      all.filter((c) => c !== this && c.name === this.name).forEach((c) => c.onmessage?.({ data } as MessageEvent));
    }
    close() {}
  }
  return FakeChannel as unknown as typeof BroadcastChannel;
}

describe("TabHub", () => {
  it("sin Shared Worker usa BroadcastChannel y llega a las otras pestanas", () => {
    const BC = fakeChannels();
    const a = new TabHub("pv-u1", { BroadcastChannel: BC });
    const b = new TabHub("pv-u1", { BroadcastChannel: BC });
    const received = vi.fn();
    b.subscribe(received);
    const mine = vi.fn();
    a.subscribe(mine);

    const message: TabMessage = { type: "reader-page", comicId: "c1", page: 7 };
    a.publish(message);

    expect(a.transport).toBe("broadcast-channel");
    expect(received).toHaveBeenCalledWith(message);
    expect(mine).not.toHaveBeenCalled();
  });

  it("no mezcla usuarios distintos", () => {
    const BC = fakeChannels();
    const a = new TabHub("pv-u1", { BroadcastChannel: BC });
    const other = new TabHub("pv-u2", { BroadcastChannel: BC });
    const received = vi.fn();
    other.subscribe(received);
    a.publish({ type: "db-changed" });
    expect(received).not.toHaveBeenCalled();
  });

  it("sin ninguna API queda inactivo sin fallar", () => {
    const hub = new TabHub("pv-u1", {});
    expect(hub.transport).toBe("none");
    expect(() => hub.publish({ type: "db-changed" })).not.toThrow();
  });
});
