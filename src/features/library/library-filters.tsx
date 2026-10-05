"use client";

import { cn } from "@/shared/lib/cn";
import type { ComicFormat, ReadingDirection } from "@/shared/offline/types";

import type { LibraryFilters as Filters, SortKey } from "./filters";

type Option<T> = { value: T; label: string };

const formats: Option<ComicFormat | "ALL">[] = [
  { value: "ALL", label: "Todos" },
  { value: "CBZ", label: "CBZ" },
  { value: "PDF", label: "PDF" },
  { value: "IMAGES", label: "Imágenes" },
];
const directions: Option<ReadingDirection | "ALL">[] = [
  { value: "ALL", label: "Todas" },
  { value: "LEFT_TO_RIGHT", label: "Occidental" },
  { value: "RIGHT_TO_LEFT", label: "Manga" },
];
const sorts: Option<SortKey>[] = [
  { value: "recent", label: "Recientes" },
  { value: "title", label: "Título (A-Z)" },
  { value: "progress", label: "Progreso" },
];

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-3">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="w-20 font-mono text-[11px] font-bold uppercase text-ink-muted">
        {label}
      </span>
      <div className="inline-flex flex-wrap rounded-[var(--radius-chip)] border-2 border-line bg-surface p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[4px] px-3 py-1 font-mono text-xs font-bold uppercase",
              value === option.value ? "bg-accent text-on-accent" : "hover:bg-surface-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function LibraryFilters({ filters, onChange, shown, total }: { filters: Filters; onChange: (f: Filters) => void; shown: number; total: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-4 shadow-hard lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3">
        <Segmented label="Formato" options={formats} value={filters.format} onChange={(format) => onChange({ ...filters, format })} />
        <Segmented label="Lectura" options={directions} value={filters.direction} onChange={(direction) => onChange({ ...filters, direction })} />
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="library-sort" className="font-mono text-[11px] font-bold uppercase text-ink-muted">
          Ordenar
        </label>
        <select
          id="library-sort"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
          className="h-10 rounded-[var(--radius-chip)] border-2 border-line bg-surface px-2 font-mono text-xs font-bold uppercase"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="rounded-[var(--radius-chip)] border-2 border-line bg-surface-muted px-2 py-1 font-mono text-[11px] font-bold" aria-live="polite">
          {shown} de {total}
        </span>
      </div>
    </div>
  );
}
