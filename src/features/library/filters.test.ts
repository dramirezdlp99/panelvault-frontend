import { describe, expect, it } from "vitest";

import { makeComic } from "@/test/idb";

import { defaultFilters, filterComics, fold } from "./filters";

const nemo = makeComic({ title: "Little Nemo", format: "CBZ", updatedAt: "2026-01-01T00:00:00Z" });
const akira = makeComic({ title: "Akira", series: "Kodansha", format: "PDF", readingDirection: "RIGHT_TO_LEFT", updatedAt: "2026-03-01T00:00:00Z" });
const cronica = makeComic({ title: "Crónica 10", tags: ["humor"], format: "IMAGES", updatedAt: "2026-02-01T00:00:00Z" });
const cronica2 = makeComic({ title: "Crónica 2", format: "IMAGES", updatedAt: "2025-01-01T00:00:00Z" });
const all = [nemo, akira, cronica, cronica2];

describe("filterComics", () => {
  it("ordena por lo más reciente por defecto", () => {
    expect(filterComics(all, [], defaultFilters).map((c) => c.title)).toEqual(["Akira", "Crónica 10", "Little Nemo", "Crónica 2"]);
  });

  it("ordena por título con números naturales", () => {
    expect(filterComics(all, [], { ...defaultFilters, sort: "title" }).map((c) => c.title)).toEqual([
      "Akira",
      "Crónica 2",
      "Crónica 10",
      "Little Nemo",
    ]);
  });

  it("filtra por formato y dirección", () => {
    expect(filterComics(all, [], { ...defaultFilters, format: "IMAGES" })).toHaveLength(2);
    expect(filterComics(all, [], { ...defaultFilters, direction: "RIGHT_TO_LEFT" })).toEqual([akira]);
  });

  it("busca sin importar tildes en título, serie y etiquetas", () => {
    expect(filterComics(all, [], { ...defaultFilters, query: "cronica" })).toHaveLength(2);
    expect(filterComics(all, [], { ...defaultFilters, query: "KODANSHA" })).toEqual([akira]);
    expect(filterComics(all, [], { ...defaultFilters, query: "humor" })).toEqual([cronica]);
  });

  it("ordena por progreso", () => {
    const p = (comicId: string, currentPage: number) => ({ comicId, currentPage, currentPanel: 0, guidedMode: false, totalPages: 10, clientUpdatedAt: "", deviceId: "" });
    const sorted = filterComics(all, [p(nemo.id, 9), p(akira.id, 2)], { ...defaultFilters, sort: "progress" });
    expect(sorted[0]).toBe(nemo);
  });

  it("fold quita tildes y mayúsculas", () => {
    expect(fold("CÓMIC Ñandú")).toBe("comic nandu");
  });
});
