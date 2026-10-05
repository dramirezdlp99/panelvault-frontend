import { describe, expect, it } from "vitest";

import { relativeTime } from "./relative-time";

const now = new Date("2026-10-05T12:00:00Z");

describe("relativeTime", () => {
  it.each([
    ["2026-10-05T11:59:30Z", "hace un momento"],
    ["2026-10-05T11:55:00Z", "hace 5 minutos"],
    ["2026-10-05T10:00:00Z", "hace 2 horas"],
    ["2026-10-04T12:00:00Z", "ayer"],
    ["2026-09-21T12:00:00Z", "hace 2 semanas"],
  ])("%s → %s", (iso, expected) => {
    expect(relativeTime(iso, now)).toBe(expected);
  });

  it("devuelve vacío para fechas inválidas", () => {
    expect(relativeTime("no es fecha", now)).toBe("");
  });
});
