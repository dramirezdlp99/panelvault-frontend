"use client";

import { Bookmark, Check, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { listComics } from "@/features/library/repository";
import { MAX_NOTE_LENGTH, removeBookmark, saveBookmark } from "@/features/reader/bookmarks";
import { routes } from "@/shared/config/routes";
import { useLocalStore } from "@/shared/offline/local-store";
import type { LocalBookmark } from "@/shared/offline/types";
import { useDbQuery } from "@/shared/offline/use-db-query";
import { Badge } from "@/shared/ui/badge";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Spinner } from "@/shared/ui/spinner";

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function BookmarkItem({ bookmark, canRead }: { bookmark: LocalBookmark; canRead: boolean }) {
  const { db } = useLocalStore();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(bookmark.note ?? "");

  async function save() {
    if (!db) return;
    await saveBookmark(db, { ...bookmark, note });
    setEditing(false);
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Badge>{`Página ${bookmark.page}`}</Badge>
        <span className="font-mono text-[11px] text-ink-muted">{bookmark.createdAt ? dateFormat.format(new Date(bookmark.createdAt)) : ""}</span>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`nota-${bookmark.id}`} className="sr-only">
            Nota del marcador
          </label>
          <textarea
            id={`nota-${bookmark.id}`}
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-[var(--radius-chip)] border-2 border-line bg-surface p-2 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => void save()} className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] border-2 border-line bg-accent px-2 py-1 text-xs font-bold uppercase text-on-accent">
              <Check aria-hidden className="size-3.5" />
              Guardar nota
            </button>
            <button type="button" onClick={() => { setNote(bookmark.note ?? ""); setEditing(false); }} className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] border-2 border-line px-2 py-1 text-xs font-bold uppercase">
              <X aria-hidden className="size-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="flex-1">{bookmark.note || <span className="text-ink-muted">Sin nota</span>}</p>
      )}
      <div className="flex items-center gap-2 border-t-2 border-dashed border-line/20 pt-3">
        {canRead ? (
          <Link href={routes.reader(bookmark.comicId, bookmark.page)} className="mr-auto font-mono text-xs font-bold uppercase text-accent hover:underline">
            Ir a la página
          </Link>
        ) : (
          <span className="mr-auto font-mono text-[11px] uppercase text-ink-muted">Archivo en otro dispositivo</span>
        )}
        <button type="button" onClick={() => setEditing(true)} aria-label={`Editar nota de la página ${bookmark.page}`} className="inline-flex size-8 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line">
          <Pencil aria-hidden className="size-4" />
        </button>
        <button type="button" onClick={() => db && void removeBookmark(db, bookmark.id)} aria-label={`Eliminar marcador de la página ${bookmark.page}`} className="inline-flex size-8 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line text-accent">
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
    </Card>
  );
}

/** Todos los marcadores del dispositivo, agrupados por cómic. */
export function BookmarksView() {
  const { db } = useLocalStore();
  const { data, loading } = useDbQuery(db, async (d) => ({ comics: await listComics(d), bookmarks: await d.getAll("bookmarks") }), []);

  const groups = useMemo(() => {
    if (!data) return [];
    const byComic = new Map<string, LocalBookmark[]>();
    for (const b of data.bookmarks) byComic.set(b.comicId, [...(byComic.get(b.comicId) ?? []), b]);
    return data.comics
      .filter((c) => byComic.has(c.id))
      .sort((a, b) => a.title.localeCompare(b.title, "es"))
      .map((comic) => ({ comic, bookmarks: byComic.get(comic.id)!.sort((a, b) => a.page - b.page) }));
  }, [data]);

  if (loading || !data) return <Spinner label="Cargando marcadores" />;
  if (groups.length === 0) {
    return (
      <EmptyState icon={Bookmark} title="Aún no tienes marcadores" action={<ButtonLink href={routes.library}>Ir a la biblioteca</ButtonLink>}>
        En el lector, toca el ícono del marcador para guardar una página.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ comic, bookmarks }) => (
        <section key={comic.id} aria-labelledby={`grupo-${comic.id}`} className="flex flex-col gap-4">
          <h2 id={`grupo-${comic.id}`} className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase">
            <Link href={routes.comic(comic.id)} className="hover:text-accent">
              {comic.title}
            </Link>
            <Badge tone="neutral">{bookmarks.length}</Badge>
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.id}>
                <BookmarkItem bookmark={bookmark} canRead={comic.hasFiles} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
