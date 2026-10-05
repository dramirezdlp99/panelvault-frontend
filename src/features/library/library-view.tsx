"use client";

import { FileUp, Library as LibraryIcon, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type DragEvent } from "react";

import { api } from "@/shared/api/http";
import type { Page } from "@/shared/api/types";
import { routes } from "@/shared/config/routes";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { useLocalStore } from "@/shared/offline/local-store";
import { useDbQuery } from "@/shared/offline/use-db-query";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Spinner } from "@/shared/ui/spinner";

import { ComicCard } from "./comic-card";
import { defaultFilters, filterComics, type LibraryFilters as Filters } from "./filters";
import { ImportDialog } from "./import-dialog";
import { LibraryFilters } from "./library-filters";
import { LibraryStats } from "./library-stats";
import { fetchAllRemote, mergeRemote } from "./pull";
import { listComics, listProgress } from "./repository";
import { computeStats } from "./stats";
import { SyncStatus } from "./sync-status";
import type { RemoteComic } from "./types";

const fetchComicsPage = (page: number) => api<Page<RemoteComic>>(`/library/comics?page=${page}&size=100`);

/**
 * Biblioteca (renderizada en el navegador): lee de IndexedDB, así que funciona sin conexión.
 * Con conexión, trae los cómics registrados desde otros dispositivos.
 */
export function LibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const online = useOnlineStatus();
  const { db } = useLocalStore();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [importOpen, setImportOpen] = useState(false);
  const [dropped, setDropped] = useState<File[] | null>(null);
  const query = searchParams.get("q") ?? "";

  const { data, loading } = useDbQuery(db, async (d) => ({ comics: await listComics(d), progress: await listProgress(d) }), []);

  useEffect(() => {
    if (!db || !online) return;
    // Trae lo registrado desde otros dispositivos; si falla, la biblioteca local sigue funcionando.
    fetchAllRemote(fetchComicsPage)
      .then((remote) => mergeRemote(db, remote))
      .catch(() => undefined);
  }, [db, online]);

  const visible = useMemo(
    () => (data ? filterComics(data.comics, data.progress, { ...filters, query }) : []),
    [data, filters, query],
  );
  const progressById = useMemo(() => new Map((data?.progress ?? []).map((p) => [p.comicId, p])), [data]);
  const stats = useMemo(() => computeStats(data?.comics ?? [], data?.progress ?? []), [data]);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    if (event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    setDropped(Array.from(event.dataTransfer.files));
    setImportOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <PageHeader
        eyebrow="Tu colección"
        title="Biblioteca"
        description="Tus cómics viven en este dispositivo; sus datos y tu progreso se sincronizan."
        actions={
          <>
            <SyncStatus />
            <Button onClick={() => { setDropped(null); setImportOpen(true); }}>
              <FileUp aria-hidden className="size-4" />
              Importar cómic
            </Button>
          </>
        }
      />

      {loading || !data ? (
        <Spinner label="Cargando biblioteca" />
      ) : data.comics.length === 0 ? (
        <EmptyState
          icon={LibraryIcon}
          title="Importa tu primer cómic"
          action={<Button onClick={() => setImportOpen(true)}>Importar cómic</Button>}
        >
          Arrastra aquí un CBZ, un PDF o varias imágenes. Se guardan en este dispositivo para leer incluso sin conexión.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          <LibraryStats stats={stats} />
          <LibraryFilters filters={filters} onChange={setFilters} shown={visible.length} total={data.comics.length} />
          {query ? (
            <p className="font-mono text-xs font-bold uppercase">
              Resultados para «{query}» ·{" "}
              <button type="button" className="text-accent underline" onClick={() => router.push(routes.library)}>
                quitar búsqueda
              </button>
            </p>
          ) : null}
          {visible.length === 0 ? (
            <EmptyState icon={SearchX} title="Sin resultados">
              Ningún cómic coincide con los filtros.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((comic) => (
                <li key={comic.id}>
                  <ComicCard comic={comic} progress={progressById.get(comic.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ImportDialog
        open={importOpen}
        initialFiles={dropped}
        onClose={() => setImportOpen(false)}
        onImported={(comic) => {
          setImportOpen(false);
          router.push(routes.comic(comic.id));
        }}
      />
    </div>
  );
}
