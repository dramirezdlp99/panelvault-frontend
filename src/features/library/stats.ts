import type { LocalComic, LocalProgress } from "@/shared/offline/types";

export type LibraryStats = { comics: number; pagesRead: number; inProgress: number; finished: number };

export function isFinished(progress: LocalProgress | undefined, pageCount: number): boolean {
  return Boolean(progress) && progress!.currentPage >= pageCount;
}

/** Porcentaje leído (0 a 100) según la página actual. */
export function percentRead(progress: LocalProgress | undefined, pageCount: number): number {
  if (!progress || pageCount <= 0) return 0;
  return Math.min(100, Math.round((progress.currentPage / pageCount) * 100));
}

/** Estadísticas calculadas en el dispositivo: funcionan sin conexión. */
export function computeStats(comics: LocalComic[], progress: LocalProgress[]): LibraryStats {
  const byComic = new Map(progress.map((p) => [p.comicId, p]));
  let pagesRead = 0;
  let inProgress = 0;
  let finished = 0;
  for (const comic of comics) {
    const p = byComic.get(comic.id);
    if (!p) continue;
    pagesRead += Math.min(p.currentPage, comic.pageCount);
    if (isFinished(p, comic.pageCount)) finished++;
    else inProgress++;
  }
  return { comics: comics.length, pagesRead, inProgress, finished };
}
