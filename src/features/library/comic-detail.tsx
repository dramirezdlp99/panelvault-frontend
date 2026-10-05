"use client";

import { ArrowLeft, BookOpen, Bookmark, CloudDownload, Pencil, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { routes } from "@/shared/config/routes";
import { useLocalStore } from "@/shared/offline/local-store";
import type { LocalComic } from "@/shared/offline/types";
import { useDbQuery } from "@/shared/offline/use-db-query";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Spinner } from "@/shared/ui/spinner";

import { ComicCover } from "./comic-cover";
import { ComicEditForm } from "./comic-edit-form";
import { ImportDialog } from "./import-dialog";
import { ProgressBar } from "./progress-bar";
import { deleteComic, getComic, getProgress } from "./repository";
import { percentRead } from "./stats";
import { DIRECTION_LABELS, FORMAT_LABELS } from "./types";

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] font-bold uppercase text-ink-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

/** Lee el id de la URL (?id=) en el navegador. */
export function ComicDetailPage() {
  const id = useSearchParams().get("id") ?? "";
  return <ComicDetail key={id} id={id} />;
}

export function ComicDetail({ id }: { id: string }) {
  const router = useRouter();
  const { db } = useLocalStore();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, loading } = useDbQuery(
    db,
    async (d) => ({
      comic: await getComic(d, id),
      progress: await getProgress(d, id),
      bookmarks: (await d.getAllFromIndex("bookmarks", "byComic", id)).sort((a, b) => a.page - b.page),
    }),
    [id],
  );

  if (loading || !data) return <Spinner label="Cargando cómic" />;
  if (!data.comic) {
    return (
      <EmptyState icon={TriangleAlert} title="Cómic no encontrado" action={<ButtonLink href={routes.library}>Volver a la biblioteca</ButtonLink>}>
        No está en este dispositivo. Puede que se haya borrado.
      </EmptyState>
    );
  }

  const comic: LocalComic = data.comic;
  const percent = percentRead(data.progress, comic.pageCount);

  async function remove() {
    if (!db) return;
    setDeleting(true);
    await deleteComic(db, comic.id);
    router.replace(routes.library);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <Link href={routes.library} className="inline-flex items-center gap-2 self-start font-mono text-xs font-bold uppercase hover:text-accent">
        <ArrowLeft aria-hidden className="size-4" />
        Volver a la biblioteca
      </Link>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit overflow-hidden">
          <ComicCover blob={comic.cover} title={comic.title} className="border-b-0" />
        </Card>

        <Card className="flex flex-col gap-6 p-6 sm:p-8">
          {!comic.hasFiles ? (
            <Alert tone="info" title="Los archivos están en otro dispositivo">
              Este cómic está registrado en tu cuenta, pero sus páginas no están guardadas aquí. Vuelve a importar el
              mismo archivo para leerlo en este dispositivo.
              <div className="mt-3">
                <Button size="sm" onClick={() => setImportOpen(true)}>
                  <CloudDownload aria-hidden className="size-4" />
                  Importar archivo
                </Button>
              </div>
            </Alert>
          ) : null}

          {editing ? (
            <ComicEditForm comic={comic} onDone={() => setEditing(false)} />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge>{FORMAT_LABELS[comic.format]}</Badge>
                <Badge tone="neutral">{DIRECTION_LABELS[comic.readingDirection]}</Badge>
              </div>
              <div>
                <h1 className="font-display text-4xl font-extrabold uppercase leading-tight tracking-tight">{comic.title}</h1>
                {comic.series || comic.issueNumber ? (
                  <p className="mt-1 font-mono text-sm uppercase text-ink-muted">
                    {[comic.series, comic.issueNumber ? `#${comic.issueNumber}` : null].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
              {comic.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Etiquetas">
                  {comic.tags.map((tag) => (
                    <li key={tag} className="rounded-[var(--radius-chip)] border-2 border-line bg-highlight px-2.5 py-0.5 font-mono text-xs font-bold text-on-highlight">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <dl className="grid grid-cols-2 gap-4 rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted p-4 sm:grid-cols-4">
                <Info label="Páginas" value={String(comic.pageCount)} />
                <Info label="Formato" value={FORMAT_LABELS[comic.format]} />
                <Info label="Lectura" value={DIRECTION_LABELS[comic.readingDirection]} />
                <Info label="Importado" value={dateFormat.format(new Date(comic.createdAt))} />
              </dl>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-mono text-xs font-bold uppercase">
                  <span>Progreso</span>
                  <span>
                    Pág. {data.progress?.currentPage ?? 0} de {comic.pageCount} ({percent}%)
                  </span>
                </div>
                <ProgressBar percent={percent} label="Progreso de lectura" />
              </div>
              <div className="flex flex-wrap gap-3">
                {comic.hasFiles ? (
                  <ButtonLink href={routes.reader(comic.id)} size="lg">
                    <BookOpen aria-hidden className="size-5" />
                    {data.progress ? "Continuar leyendo" : "Empezar a leer"}
                  </ButtonLink>
                ) : null}
                <Button variant="secondary" size="lg" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden className="size-5" />
                  Editar
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <section aria-labelledby="marcadores-title" className="flex flex-col gap-4">
        <h2 id="marcadores-title" className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase">
          <Bookmark aria-hidden className="size-6 text-accent" />
          Marcadores
          <Badge tone="neutral">{data.bookmarks.length}</Badge>
        </h2>
        {data.bookmarks.length === 0 ? (
          <p className="text-ink-muted">Aún no tienes marcadores en este cómic. Agrégalos desde el lector.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.bookmarks.map((bookmark) => (
              <li key={bookmark.id}>
                <Card className="flex h-full flex-col gap-2 p-4">
                  <Badge className="self-start">Pág. {bookmark.page}</Badge>
                  <p className="flex-1">{bookmark.note || <span className="text-ink-muted">Sin nota</span>}</p>
                  {comic.hasFiles ? (
                    <Link href={routes.reader(comic.id, bookmark.page)} className="font-mono text-xs font-bold uppercase text-accent hover:underline">
                      Ir a la página
                    </Link>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="peligro-title" className="flex flex-col gap-4 rounded-[var(--radius-panel)] border-2 border-accent bg-surface p-6 shadow-[4px_4px_0_0_var(--pv-accent)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="peligro-title" className="font-display text-xl font-extrabold uppercase text-accent">
            Zona de peligro
          </h2>
          <p className="text-ink-muted">Eliminar este cómic borra sus páginas de este dispositivo, tu progreso y tus marcadores.</p>
        </div>
        <Button onClick={() => { setAcknowledged(false); setConfirmOpen(true); }}>
          <Trash2 aria-hidden className="size-4" />
          Eliminar cómic
        </Button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar este cómic de la biblioteca?"
        confirmLabel="Sí, eliminar cómic"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void remove()}
        pending={deleting}
        acknowledgement="Entiendo que se borrarán el progreso y los marcadores."
        acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged}
      >
        Vas a borrar «{comic.title}» de tu biblioteca. Esta acción no se puede deshacer.
      </ConfirmDialog>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={() => setImportOpen(false)} />
    </div>
  );
}
