import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type PaginationProps = {
  /** Página actual empezando en 0, como en el backend. */
  page: number;
  totalPages: number;
  /** Construye el enlace de una página (0-based). */
  hrefFor: (page: number) => string;
  totalItems?: number;
  itemLabel?: string;
};

/** Paginación con enlaces reales (funciona sin JavaScript y se puede compartir la URL). */
export function Pagination({ page, totalPages, hrefFor, totalItems, itemLabel = "resultados" }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i).filter((i) => Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1);

  const box = "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line px-3 font-display font-bold";

  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-4 shadow-hard sm:flex-row">
      <p className="font-mono text-xs font-bold uppercase">
        Página {page + 1} de {totalPages}
        {totalItems !== undefined ? ` · ${totalItems} ${itemLabel}` : ""}
      </p>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 0 ? (
            <Link href={hrefFor(page - 1)} className={cn(box, "bg-surface")} aria-label="Página anterior">
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          ) : null}
        </li>
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(box, p === page ? "bg-accent text-on-accent" : "bg-surface")}
            >
              {p + 1}
            </Link>
          </li>
        ))}
        <li>
          {page < totalPages - 1 ? (
            <Link href={hrefFor(page + 1)} className={cn(box, "bg-surface")} aria-label="Página siguiente">
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
