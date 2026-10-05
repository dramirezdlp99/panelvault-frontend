"use client";

import { BookOpen, CloudDownload, Info, RotateCcw } from "lucide-react";
import Link from "next/link";

import { routes } from "@/shared/config/routes";
import type { LocalComic, LocalProgress } from "@/shared/offline/types";
import { Badge } from "@/shared/ui/badge";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { ComicCover } from "./comic-cover";
import { ProgressBar } from "./progress-bar";
import { isFinished, percentRead } from "./stats";
import { DIRECTION_LABELS, FORMAT_LABELS } from "./types";

export function ComicCard({ comic, progress }: { comic: LocalComic; progress?: LocalProgress }) {
  const percent = percentRead(progress, comic.pageCount);
  const finished = isFinished(progress, comic.pageCount);
  const subtitle = [comic.series, comic.issueNumber ? `#${comic.issueNumber}` : null].filter(Boolean).join(" ");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link href={routes.comic(comic.id)} className="relative block" aria-label={`Detalle de ${comic.title}`}>
        <ComicCover blob={comic.cover} title={comic.title} />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <Badge>{FORMAT_LABELS[comic.format]}</Badge>
          <Badge tone="neutral">{DIRECTION_LABELS[comic.readingDirection]}</Badge>
        </div>
        {!comic.hasFiles ? (
          <Badge tone="ai" className="absolute bottom-2 right-2">
            <CloudDownload aria-hidden className="size-3" />
            Solo datos
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 font-display text-lg font-extrabold uppercase leading-tight">{comic.title}</h2>
        {subtitle ? <p className="font-mono text-[11px] uppercase text-ink-muted">{subtitle}</p> : null}
        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          <div className="flex justify-between font-mono text-[11px] font-bold uppercase">
            <span>Progreso</span>
            <span>
              Pág. {progress?.currentPage ?? 0} de {comic.pageCount}
            </span>
          </div>
          <ProgressBar percent={percent} label={`Progreso de ${comic.title}`} />
        </div>
        <div className="flex gap-2 pt-2">
          {comic.hasFiles ? (
            <ButtonLink href={routes.reader(comic.id)} size="sm" variant={finished ? "secondary" : "primary"} className="flex-1">
              {finished ? <RotateCcw aria-hidden className="size-4" /> : <BookOpen aria-hidden className="size-4" />}
              {finished ? "Releer" : progress ? "Continuar" : "Leer"}
            </ButtonLink>
          ) : (
            <ButtonLink href={routes.comic(comic.id)} size="sm" variant="secondary" className="flex-1">
              <Info aria-hidden className="size-4" />
              Ver datos
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  );
}
