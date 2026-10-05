import { BookCheck, BookOpen, Files, Library } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import type { LibraryStats as Stats } from "./stats";

const items = [
  { key: "comics", label: "Cómics", icon: Library },
  { key: "pagesRead", label: "Páginas leídas", icon: Files },
  { key: "inProgress", label: "En progreso", icon: BookOpen },
  { key: "finished", label: "Terminados", icon: BookCheck },
] as const;

export function LibraryStats({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex flex-col gap-3 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-4 shadow-hard">
          <div className="flex items-center justify-between">
            <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</dt>
            <span className={cn("inline-flex size-8 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line", key === "inProgress" ? "bg-highlight text-on-highlight" : "bg-surface-muted")}>
              <Icon aria-hidden className="size-4" />
            </span>
          </div>
          <dd className={cn("font-display text-4xl font-extrabold leading-none", key === "inProgress" && "text-accent")}>
            {stats[key].toLocaleString("es-CO")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
