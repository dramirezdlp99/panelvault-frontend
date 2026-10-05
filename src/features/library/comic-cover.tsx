"use client";

import { BookImage } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useBlobUrl } from "@/shared/offline/use-blob-url";

/** Portada del cómic desde IndexedDB; si no hay archivo en este dispositivo, una portada de relleno. */
export function ComicCover({ blob, title, className }: { blob: Blob | null; title: string; className?: string }) {
  const url = useBlobUrl(blob);
  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden border-b-2 border-line bg-surface-muted", className)}>
      {url ? (
        // Las portadas son Blobs locales (no URLs externas), por eso no se usa next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Portada de ${title}`} className="h-full w-full object-cover" />
      ) : (
        <div className="halftone flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-ink-muted">
          <BookImage aria-hidden className="size-10" />
          <span className="line-clamp-3 font-display text-lg font-extrabold uppercase text-ink">{title}</span>
        </div>
      )}
    </div>
  );
}
