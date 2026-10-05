import { ArrowLeft, CloudOff, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LICENSE_LABELS } from "@/features/catalog/types";
import { toneFor, WorkCover } from "@/features/catalog/work-cover";
import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { EmptyState } from "@/shared/ui/empty-state";
import { loadPublishedSlugs, loadWork } from "@/server/catalog/catalog-data";

/**
 * Regeneración estática incremental (ISR): las fichas publicadas se generan en la compilación
 * y se regeneran en segundo plano como máximo cada 60 s (o al instante tras un cambio de curaduría).
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await loadPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/catalogo/[slug]">): Promise<Metadata> {
  const result = await loadWork((await params).slug);
  if (result.kind !== "ok") return { title: "Catálogo" };
  return { title: result.data.title, description: result.data.description ?? undefined };
}

export default async function WorkPage({ params }: PageProps<"/catalogo/[slug]">) {
  const { slug } = await params;
  const result = await loadWork(slug);
  if (result.kind === "not-found") notFound();

  return (
    <div className="halftone">
      <Container className="py-12 md:py-16">
        <Link href={routes.catalog} className="mb-8 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase hover:text-accent">
          <ArrowLeft aria-hidden className="size-4" />
          Volver al catálogo
        </Link>

        {result.kind === "unavailable" ? (
          <EmptyState icon={CloudOff} title="Obra no disponible por ahora">
            No pudimos contactar al servidor. Intenta de nuevo en unos segundos.
          </EmptyState>
        ) : (
          <article className="grid gap-10 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit overflow-hidden">
              <WorkCover year={result.data.year} publisher={result.data.publisher} tone={toneFor(result.data.slug)} tall />
            </Card>
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{LICENSE_LABELS[result.data.license]}</Badge>
                {result.data.pageCount ? <Badge tone="neutral">{result.data.pageCount} páginas</Badge> : null}
              </div>
              <h1 className="font-display text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
                {result.data.title}
              </h1>
              <dl className="grid gap-4 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-5 shadow-hard sm:grid-cols-3">
                <div>
                  <dt className="font-mono text-[11px] font-bold uppercase text-ink-muted">Autor</dt>
                  <dd className="font-semibold">{result.data.author}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] font-bold uppercase text-ink-muted">Año</dt>
                  <dd className="font-semibold">{result.data.year ?? "Desconocido"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] font-bold uppercase text-ink-muted">Publicado en</dt>
                  <dd className="font-semibold">{result.data.publisher ?? "Desconocido"}</dd>
                </div>
              </dl>
              {result.data.description ? <p className="max-w-2xl text-lg leading-relaxed">{result.data.description}</p> : null}
              {result.data.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Etiquetas">
                  {result.data.tags.map((tag) => (
                    <li key={tag} className="rounded-[var(--radius-chip)] border-2 border-line bg-highlight px-2.5 py-1 font-mono text-xs font-bold text-on-highlight">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                href={result.data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 self-start rounded-[var(--radius-panel)] border-2 border-line bg-surface px-5 font-display font-bold uppercase shadow-hard press"
              >
                Ver fuente
                <ExternalLink aria-hidden className="size-4" />
              </a>
            </div>
          </article>
        )}
      </Container>
    </div>
  );
}
