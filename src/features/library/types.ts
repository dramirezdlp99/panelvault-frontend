import type { ComicFormat, ReadingDirection } from "@/shared/offline/types";

/** Cómic según el backend (ComicResponse en Spring). */
export type RemoteComic = {
  id: string;
  title: string;
  series: string | null;
  issueNumber: string | null;
  pageCount: number;
  format: ComicFormat;
  fileSha256: string;
  readingDirection: ReadingDirection;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export const FORMAT_LABELS: Record<ComicFormat, string> = {
  CBZ: "CBZ",
  CBR: "CBR",
  PDF: "PDF",
  IMAGES: "Imágenes",
};

export const DIRECTION_LABELS: Record<ReadingDirection, string> = {
  LEFT_TO_RIGHT: "Occidental",
  RIGHT_TO_LEFT: "Manga",
};
