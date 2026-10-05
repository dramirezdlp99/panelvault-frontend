"use client";

import { Eye, EyeOff, Pencil, Search, Stamp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { Work } from "@/features/catalog/types";
import { errorMessage } from "@/shared/api/http";
import type { Page } from "@/shared/api/types";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Spinner } from "@/shared/ui/spinner";

import { deleteWork, listWorks, publishWork, unpublishWork } from "./api";

export function CurationList() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<Work> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Work | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listWorks(query, page));
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [query, page]);

  useEffect(() => {
    // Carga desde el backend cada vez que cambia la búsqueda o la página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setQuery(String(new FormData(event.currentTarget).get("q") ?? "").trim());
  }

  async function toggle(work: Work) {
    setBusyId(work.id);
    try {
      const updated = work.published ? await unpublishWork(work.id) : await publishWork(work.id);
      setData((d) => (d ? { ...d, items: d.items.map((w) => (w.id === updated.id ? updated : w)) } : d));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await deleteWork(toDelete.id);
      setToDelete(null);
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form role="search" onSubmit={onSearch} className="flex gap-3">
        <label htmlFor="curation-q" className="sr-only">
          Buscar obras
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input id="curation-q" name="q" type="search" placeholder="Buscar por título o autor…" className="h-11 w-full rounded-[var(--radius-panel)] border-2 border-line bg-surface pl-9 pr-3 focus:outline-none" />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {!data && !error ? <Spinner label="Cargando obras" /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState icon={Stamp} title="Sin obras" action={<ButtonLink href={routes.curationNew}>Nueva obra</ButtonLink>}>
          {query ? "Ninguna obra coincide con la búsqueda." : "Agrega la primera obra del catálogo."}
        </EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border-2 border-line bg-surface shadow-hard">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Obras del catálogo</caption>
            <thead className="border-b-2 border-line bg-surface-muted font-mono text-[11px] uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">Título</th>
                <th scope="col" className="px-4 py-3">Autor</th>
                <th scope="col" className="px-4 py-3">Año</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((work) => (
                <tr key={work.id} className="border-b border-line/20 last:border-0">
                  <th scope="row" className="px-4 py-3 font-semibold">{work.title}</th>
                  <td className="px-4 py-3">{work.author}</td>
                  <td className="px-4 py-3 font-mono">{work.year ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={work.published ? "success" : "neutral"}>{work.published ? "Publicada" : "Borrador"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void toggle(work)} disabled={busyId === work.id} aria-label={`${work.published ? "Despublicar" : "Publicar"} ${work.title}`}>
                        {work.published ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                        {work.published ? "Despublicar" : "Publicar"}
                      </Button>
                      <Link href={routes.curationEdit(work.id)} aria-label={`Editar ${work.title}`} className="inline-flex size-9 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line bg-surface hover:bg-surface-muted">
                        <Pencil aria-hidden className="size-4" />
                      </Link>
                      <button type="button" onClick={() => { setAcknowledged(false); setToDelete(work); }} aria-label={`Eliminar ${work.title}`} className="inline-flex size-9 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line bg-surface text-accent hover:bg-surface-muted">
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="font-mono text-xs uppercase">Página {page + 1} de {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar esta obra del catálogo?"
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
        pending={busyId !== null}
        acknowledgement="Entiendo que la obra desaparecerá del catálogo público."
        acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged}
      >
        Vas a borrar «{toDelete?.title}». Esta acción no se puede deshacer.
      </ConfirmDialog>
    </div>
  );
}
