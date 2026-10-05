import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("une las clases con un espacio", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignora valores vacios, falsos y nulos", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("devuelve cadena vacia si no hay clases", () => {
    expect(cn()).toBe("");
  });
});
