"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useLocalStore } from "@/shared/offline/local-store";
import type { LocalComic, ReadingDirection } from "@/shared/offline/types";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { TagInput } from "@/shared/ui/tag-input";

import { updateComic } from "./repository";
import { DIRECTION_LABELS } from "./types";

const MAX_TAGS = 10;
const normalizeTag = (raw: string) => {
  const tag = raw.trim().replace(/\s+/g, " ").toLowerCase();
  return tag && tag.length <= 30 && !tag.includes(",") ? tag : null;
};

/** Edición de metadatos: se guarda al instante en el dispositivo y se sincroniza después. */
export function ComicEditForm({ comic, onDone }: { comic: LocalComic; onDone: () => void }) {
  const { db } = useLocalStore();
  const [title, setTitle] = useState(comic.title);
  const [series, setSeries] = useState(comic.series ?? "");
  const [issue, setIssue] = useState(comic.issueNumber ?? "");
  const [direction, setDirection] = useState<ReadingDirection>(comic.readingDirection);
  const [tags, setTags] = useState(comic.tags);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!db) return;
    await updateComic(db, comic.id, {
      title: title.trim(),
      series: series.trim() || null,
      issueNumber: issue.trim() || null,
      readingDirection: direction,
      tags,
    });
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Título" error={error}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Field label="Serie">
          <Input value={series} onChange={(e) => setSeries(e.target.value)} maxLength={200} />
        </Field>
        <Field label="Número">
          <Input value={issue} onChange={(e) => setIssue(e.target.value)} maxLength={20} />
        </Field>
      </div>
      <Field label="Dirección de lectura">
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as ReadingDirection)}
          className="h-12 w-full rounded-[var(--radius-panel)] border-2 border-line bg-surface px-3"
        >
          {(Object.keys(DIRECTION_LABELS) as ReadingDirection[]).map((d) => (
            <option key={d} value={d}>
              {DIRECTION_LABELS[d]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Etiquetas" hint={`Hasta ${MAX_TAGS}.`}>
        <TagInput value={tags} onChange={setTags} normalize={normalizeTag} max={MAX_TAGS} />
      </Field>
      <div className="flex gap-3">
        <Button type="submit">
          <Save aria-hidden className="size-4" />
          Guardar
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
