import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";

import { LICENSE_LABELS, type Work } from "./types";
import { toneFor, WorkCover } from "./work-cover";

export function WorkCard({ work }: { work: Work }) {
  return (
    <Link href={routes.catalogWork(work.slug)} className="group block h-full rounded-[var(--radius-panel)]">
      <Card interactive className="flex h-full flex-col overflow-hidden">
        <WorkCover year={work.year} publisher={work.publisher} tone={toneFor(work.slug)} />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Badge className="self-start">{LICENSE_LABELS[work.license]}</Badge>
          <h2 className="font-display text-xl font-bold uppercase leading-tight group-hover:text-accent">{work.title}</h2>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            {work.author}
            {work.year ? ` · ${work.year}` : ""}
          </p>
          {work.description ? <p className="line-clamp-2 text-sm text-ink-muted">{work.description}</p> : null}
          {work.tags.length > 0 ? (
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Etiquetas">
              {work.tags.map((tag) => (
                <li key={tag} className="rounded-[var(--radius-chip)] border border-line px-2 py-0.5 font-mono text-[11px]">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
