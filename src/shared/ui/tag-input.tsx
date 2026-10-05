"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/cn";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Limpia y valida una etiqueta; null si no se acepta. */
  normalize: (raw: string) => string | null;
  max: number;
  invalid?: boolean;
  "aria-describedby"?: string;
};

/** Etiquetas como "chips": Enter o coma para agregar, la X para quitar. */
export function TagInput({ id, value, onChange, normalize, max, invalid, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const tag = normalize(draft);
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border-2 bg-surface px-3 py-2",
        invalid ? "border-accent" : "border-line",
      )}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] border-2 border-line bg-highlight py-0.5 pl-2 pr-1 font-mono text-xs font-bold text-on-highlight">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Quitar etiqueta ${tag}`} className="rounded p-0.5 hover:bg-black/10">
            <X aria-hidden className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add()}
        disabled={value.length >= max}
        placeholder={value.length >= max ? "Máximo alcanzado" : "Escribe y presiona Enter"}
        className="min-w-40 flex-1 bg-transparent py-1 focus:outline-none"
        {...aria}
      />
    </div>
  );
}
