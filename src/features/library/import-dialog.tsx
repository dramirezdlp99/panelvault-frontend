"use client";

import { FileUp, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";

import { useLocalStore } from "@/shared/offline/local-store";
import type { LocalComic, ReadingDirection } from "@/shared/offline/types";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import { ImportError } from "./import/detect";
import { importComic, type ImportProgress } from "./import/import-comic";

const STAGE_LABELS: Record<ImportProgress["stage"], string> = {
  reading: "Leyendo el archivo…",
  fingerprint: "Calculando la huella del archivo…",
  pages: "Extrayendo las páginas…",
  saving: "Guardando en este dispositivo…",
  done: "¡Listo!",
};

export const ACCEPTED_FILES = ".cbz,.zip,.pdf,.cbr,.rar,image/jpeg,image/png,image/webp,image/gif,image/avif";

type ImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported: (comic: LocalComic) => void;
  /** Archivos soltados sobre la biblioteca antes de abrir el diálogo. */
  initialFiles?: File[] | null;
};

export function ImportDialog({ open, onClose, onImported, initialFiles }: ImportDialogProps) {
  const { db } = useLocalStore();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [direction, setDirection] = useState<ReadingDirection>("LEFT_TO_RIGHT");
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null && progress.stage !== "done";

  useEffect(() => {
    if (!open) return;
    // Al abrir: se toman los archivos soltados (si los hay) y se limpia el intento anterior.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFiles(initialFiles ?? []);
    setError(null);
    setProgress(null);
  }, [open, initialFiles]);

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    setFiles(Array.from(event.dataTransfer.files));
    setError(null);
  }

  async function start() {
    if (!db || files.length === 0) return;
    setError(null);
    try {
      const comic = await importComic(db, files, { readingDirection: direction }, setProgress);
      onImported(comic);
    } catch (caught) {
      if (!(caught instanceof ImportError)) console.error("Error al importar", caught);
      setProgress(null);
      setError(caught instanceof ImportError ? caught.message : "No se pudo importar el cómic. Intenta con otro archivo.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-xl rounded-[var(--radius-panel)] border-[3px] border-line bg-surface shadow-hard-lg">
        <div className="flex items-center justify-between border-b-2 border-line px-6 py-4">
          <h2 id={titleId} className="font-display text-2xl font-extrabold uppercase">
            Importar cómic
          </h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="rounded-[var(--radius-chip)] border-2 border-line p-1 disabled:opacity-40">
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {error ? <Alert tone="error">{error}</Alert> : null}

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-panel)] border-2 border-dashed p-8 text-center",
              dragging ? "border-accent bg-highlight/30" : "border-line bg-paper",
            )}
          >
            <span className="inline-flex size-14 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface shadow-hard">
              <FileUp aria-hidden className="size-6" />
            </span>
            <span className="font-semibold">Arrastra aquí tu cómic o haz clic para elegirlo</span>
            <span className="text-sm text-ink-muted">CBZ, PDF o varias imágenes (JPG, PNG, WebP). El archivo se queda en este dispositivo.</span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              className="sr-only"
              aria-label="Elegir archivos del cómic"
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []));
                setError(null);
              }}
            />
          </label>

          {files.length > 0 ? (
            <p className="rounded-[var(--radius-chip)] border-2 border-line bg-surface-muted px-3 py-2 font-mono text-xs">
              {files.length === 1 ? files[0].name : `${files.length} imágenes seleccionadas`}
            </p>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Dirección de lectura</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["LEFT_TO_RIGHT", "Occidental", "Izquierda → derecha"],
                  ["RIGHT_TO_LEFT", "Manga", "Derecha → izquierda"],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-[var(--radius-panel)] border-2 border-line p-3",
                    direction === value ? "bg-accent text-on-accent shadow-hard" : "bg-surface",
                  )}
                >
                  <input type="radio" name="direction" value={value} checked={direction === value} onChange={() => setDirection(value)} className="sr-only" />
                  <span className="font-display font-bold uppercase">{label}</span>
                  <span className="font-mono text-[11px]">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {progress ? (
            <p role="status" className="font-mono text-sm font-bold">
              {STAGE_LABELS[progress.stage]}
              {progress.total ? ` ${progress.done} de ${progress.total}` : ""}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={() => void start()} disabled={busy || files.length === 0 || !db}>
              Importar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
