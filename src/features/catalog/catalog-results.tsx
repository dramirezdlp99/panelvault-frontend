import { CloudOff, SearchX } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { loadWorks } from "@/server/catalog/catalog-data";

import { WorkCard } from "./work-card";

export function catalogHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 0) params.set("pagina", String(page + 1));
  const search = params.toString();
  return search ? `${routes.catalog}?${search}` : routes.catalog;
}

/** Resultados del catálogo: se transmiten (streaming) mientras el encabezado ya está en pantalla. */
export async function CatalogResults({ query, page }: { query: string; page: number }) {
  const result = await loadWorks(query, page);

  if (result.kind !== "ok") {
    return (
      <EmptyState icon={CloudOff} title="Catálogo no disponible">
        No pudimos contactar al servidor. Intenta de nuevo en unos segundos.
      </EmptyState>
    );
  }

  const { items, totalItems, totalPages } = result.data;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin resultados"
        action={query ? <ButtonLink href={routes.catalog} variant="secondary">Ver todo el catálogo</ButtonLink> : undefined}
      >
        {query ? `No encontramos obras para «${query}».` : "Todavía no hay obras publicadas."}
      </EmptyState>
    );
  }

  return (
    <>
      <p className="mb-6 font-mono text-xs font-bold uppercase text-ink-muted" aria-live="polite">
        {totalItems} {totalItems === 1 ? "obra disponible" : "obras disponibles"}
      </p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((work) => (
          <li key={work.id}>
            <WorkCard work={work} />
          </li>
        ))}
      </ul>
      <Pagination
        page={result.data.page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemLabel="obras"
        hrefFor={(p) => catalogHref(query, p)}
      />
    </>
  );
}

export function CatalogSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Cargando obras" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="h-80 animate-pulse rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted" />
      ))}
    </ul>
  );
}
