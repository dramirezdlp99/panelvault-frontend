import { describe, expect, it } from "vitest";

import type { LocalProgress } from "@/shared/offline/types";
import { makeComic } from "@/test/idb";

import { computeStats, isFinished, percentRead } from "./stats";

const progress = (comicId: string, currentPage: number): LocalProgress => ({
  comicId,
  currentPage,
  currentPanel: 0,
  guidedMode: false,
  totalPages: 10,
  clientUpdatedAt: "",
  deviceId: "d",
});

describe("estadísticas", () => {
  it("calcula porcentaje y terminado", () => {
    expect(percentRead(undefined, 10)).toBe(0);
    expect(percentRead(progress("a", 5), 10)).toBe(50);
    expect(percentRead(progress("a", 12), 10)).toBe(100);
    expect(isFinished(progress("a", 10), 10)).toBe(true);
    expect(isFinished(progress("a", 9), 10)).toBe(false);
  });

  it("resume la biblioteca", () => {
    const a = makeComic({ pageCount: 10 });
    const b = makeComic({ pageCount: 20 });
    const c = makeComic({ pageCount: 5 });
    expect(computeStats([a, b, c], [progress(a.id, 10), progress(b.id, 4)])).toEqual({
      comics: 3,
      pagesRead: 14,
      inProgress: 1,
      finished: 1,
    });
  });
});
