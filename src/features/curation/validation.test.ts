import { describe, expect, it } from "vitest";

import type { Work } from "@/features/catalog/types";

import { emptyWorkForm, formFromWork, isHttpsUrl, normalizeTag, toWorkInput, validateWork } from "./validation";

const valid = { ...emptyWorkForm, title: "Mutt and Jeff", author: "Bud Fisher", sourceUrl: "https://en.wikipedia.org/wiki/Mutt" };

describe("isHttpsUrl", () => {
  it.each([
    ["https://en.wikipedia.org/wiki/X", true],
    ["http://en.wikipedia.org", false],
    ["javascript:alert(1)", false],
    ["https://localhost", false],
    ["no es url", false],
  ])("%s → %s", (url, expected) => {
    expect(isHttpsUrl(url)).toBe(expected);
  });
});

describe("validateWork (igual que WorkDetails del backend)", () => {
  it("acepta una obra minima valida", () => {
    expect(validateWork(valid)).toEqual({});
  });

  it("exige titulo, autor y fuente", () => {
    const errors = validateWork(emptyWorkForm);
    expect(Object.keys(errors).sort()).toEqual(["author", "sourceUrl", "title"]);
  });

  it("valida el rango del ano y de paginas", () => {
    expect(validateWork({ ...valid, year: "1700" }, 2026).year).toMatch(/1800 y 2026/);
    expect(validateWork({ ...valid, year: "2030" }, 2026).year).toBeDefined();
    expect(validateWork({ ...valid, year: "19x5" }).year).toBeDefined();
    expect(validateWork({ ...valid, pageCount: "0" }).pageCount).toBeDefined();
    expect(validateWork({ ...valid, pageCount: "120" }).pageCount).toBeUndefined();
  });

  it("la portada es opcional pero si existe debe ser https", () => {
    expect(validateWork({ ...valid, coverUrl: "http://x.com/a.jpg" }).coverUrl).toBeDefined();
    expect(validateWork({ ...valid, coverUrl: "https://x.com/a.jpg" }).coverUrl).toBeUndefined();
  });
});

describe("normalizeTag", () => {
  it("limpia espacios y pasa a minusculas", () => {
    expect(normalizeTag("  Tira   DE Prensa ")).toBe("tira de prensa");
  });

  it("rechaza vacias, largas o con comas", () => {
    expect(normalizeTag("  ")).toBeNull();
    expect(normalizeTag("x".repeat(31))).toBeNull();
    expect(normalizeTag("a,b")).toBeNull();
  });
});

describe("conversiones", () => {
  it("convierte el formulario en la peticion del backend", () => {
    expect(toWorkInput({ ...valid, year: "1907", publisher: "  ", tags: ["humor"] })).toEqual({
      title: "Mutt and Jeff",
      author: "Bud Fisher",
      year: 1907,
      publisher: null,
      description: null,
      sourceUrl: "https://en.wikipedia.org/wiki/Mutt",
      coverUrl: null,
      license: "PUBLIC_DOMAIN",
      pageCount: null,
      tags: ["humor"],
    });
  });

  it("carga una obra existente en el formulario", () => {
    const work = { id: "w", slug: "s", title: "T", author: "A", year: 1900, sourceUrl: "https://x.org", license: "CC0", tags: ["a"], published: true, updatedAt: "" } as Work;
    expect(formFromWork(work)).toMatchObject({ title: "T", year: "1900", publisher: "", license: "CC0", tags: ["a"] });
  });
});
