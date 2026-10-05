"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

import { ComicCover } from "@/features/library/comic-cover";
import { ProgressBar } from "@/features/library/progress-bar";
import { listComics, listProgress } from "@/features/library/repository";
import { isFinished, percentRead } from "@/features/library/stats";
import { mergeRemoteProgress, type RemoteProgress } from "@/features/reader/progress";
import { api } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { relativeTime } from "@/shared/lib/relative-time";
import { useLocalStore } from "@/shared/offline/local-store";
import { useDbQuery } from "@/shared/offline/use-db-query";
import { Badge } from "@/shared/ui/badge";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Spinner } from "@/shared/ui/spinner";

type RecentReading = { comicId: string; title: string; progress: RemoteProgress };

/** Lecturas recientes: del dispositivo, completadas con el progreso de otros dispositivos. */
export function ReadingList() {
  const { db } = useLocalStore();
  const online = useOnlineStatus();
  const { data, loading } = useDbQuery(db, async (d) => ({ comics: await listComics(d), progress: await listProgress(d) }), []);

  useEffect(() => {
    if (!db || !online) return;
    api<RecentReading[]>("/reading/recent?limit=20")
      .then(async (recent) => {
        for (const item of recent) await mergeRemoteProgress(db, item.progress);
      })
      .catch(() => undefined);
  }, [db, online]);

  const entries = useMemo(() => {
    if (!data) return [];
    const comics = new Map(data.comics.map((c) => [c.id, c]));
    return data.progress
      .filter((p) => comics.has(p.comicId))
      .sort((a, b) => b.clientUpdatedAt.localeCompare(a.clientUpdatedAt))
      .map((progress) => ({ progress, comic: comics.get(progress.comicId)! }));
  }, [data]);

  if (loading || !data) return <Spinner label="Cargando lecturas" />;
  if (entries.length === 0) {
    return (
      <EmptyState icon={BookOpen} title="Aún no estás leyendo nada" action={<ButtonLink href={routes.library}>Ir a la biblioteca</ButtonLink>}>
        Abre un cómic y aquí aparecerá para que continúes donde lo dejaste.
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {entries.map(({ comic, progress }) => {
        const percent = percentRead(progress, comic.pageCount);
        const finished = isFinished(progress, comic.pageCount);
        return (
          <li key={comic.id}>
            <Card className="flex items-stretch gap-4 overflow-hidden p-0 pr-4">
              <Link href={routes.comic(comic.id)} className="w-24 shrink-0 border-r-2 border-line sm:w-28" aria-label={`Detalle de ${comic.title}`}>
                <ComicCover blob={comic.cover} title={comic.title} className="h-full border-b-0" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-xl font-extrabold uppercase">{comic.title}</h2>
                  {finished ? <Badge tone="success">Terminado</Badge> : null}
                  {progress.guidedMode ? <Badge tone="ai">Viñeta por viñeta</Badge> : null}
                </div>
                <p className="font-mono text-xs uppercase text-ink-muted">
                  Pág. {progress.currentPage} de {comic.pageCount} · {relativeTime(progress.clientUpdatedAt)}
                </p>
                <ProgressBar percent={percent} label={`Progreso de ${comic.title}`} className="max-w-md" />
              </div>
              <div className="flex items-center">
                {comic.hasFiles ? (
                  <ButtonLink href={routes.reader(comic.id)} size="sm" variant={finished ? "secondary" : "primary"}>
                    {finished ? "Releer" : "Continuar"}
                  </ButtonLink>
                ) : (
                  <Badge tone="ai">Otro dispositivo</Badge>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
