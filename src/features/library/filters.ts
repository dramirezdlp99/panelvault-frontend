import type { ComicFormat, LocalComic, LocalProgress, ReadingDirection } from "@/shared/offline/types";

import { percentRead } from "./stats";

export type SortKey = "recent" | "title" | "progress";
export type LibraryFilters = {
  query: string;
  format: ComicFormat | "ALL";
  direction: ReadingDirection | "ALL";
  sort: SortKey;
};

export const defaultFilters: LibraryFilters = { query: "", format: "ALL", direction: "ALL", sort: "recent" };

/** Quita tildes y mayúsculas para que "comic" encuentre "Cómic". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filterComics(comics: LocalComic[], progress: LocalProgress[], filters: LibraryFilters): LocalComic[] {
  const byComic = new Map(progress.map((p) => [p.comicId, p]));
  const q = fold(filters.query.trim());
  const filtered = comics.filter((comic) => {
    if (filters.format !== "ALL" && comic.format !== filters.format) return false;
    if (filters.direction !== "ALL" && comic.readingDirection !== filters.direction) return false;
    if (!q) return true;
    return [comic.title, comic.series ?? "", comic.issueNumber ?? "", ...comic.tags].some((field) => fold(field).includes(q));
  });

  const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
  return filtered.sort((a, b) => {
    if (filters.sort === "title") return collator.compare(a.title, b.title);
    if (filters.sort === "progress") {
      return percentRead(byComic.get(b.id), b.pageCount) - percentRead(byComic.get(a.id), a.pageCount);
    }
    const lastA = byComic.get(a.id)?.clientUpdatedAt ?? a.updatedAt;
    const lastB = byComic.get(b.id)?.clientUpdatedAt ?? b.updatedAt;
    return lastB.localeCompare(lastA);
  });
}
