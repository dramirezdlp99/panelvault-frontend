import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogResults, CatalogSkeleton } from "@/features/catalog/catalog-results";
import { CatalogSearch } from "@/features/catalog/catalog-search";
import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/container";

export const metadata: Metadata = {
  title: "Catálogo de dominio público",
  description: "Obras pioneras de la historieta, libres de derechos de autor.",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Renderizado en el servidor por petición (depende de la búsqueda), con los datos
 * cacheados 60 s y los resultados transmitidos con Suspense (streaming).
 */
export default async function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const pageNumber = Number.parseInt(first(params.pagina), 10);
  const page = Number.isFinite(pageNumber) && pageNumber > 1 ? pageNumber - 1 : 0;

  return (
    <div className="halftone">
      <Container className="py-12 md:py-16">
        <header className="mb-10 flex flex-col gap-4">
          <Badge className="self-start">Archivo abierto</Badge>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Catálogo de dominio público</h1>
          <p className="max-w-2xl text-lg text-ink-muted">
            Obras pioneras de la historieta de prensa, libres de derechos de autor y listas para leer.
          </p>
        </header>
        <div className="mb-10 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-4 shadow-hard sm:p-6">
          <CatalogSearch query={query} />
        </div>
        <Suspense key={`${query}|${page}`} fallback={<CatalogSkeleton />}>
          <CatalogResults query={query} page={page} />
        </Suspense>
      </Container>
    </div>
  );
}
