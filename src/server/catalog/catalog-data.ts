import "server-only";

import { unstable_cache } from "next/cache";

import type { Work } from "@/features/catalog/types";
import type { Page } from "@/shared/api/types";

import { backendFetch, BackendUnavailableError } from "../backend/client";
import { CATALOG_TAG } from "../cache-tags";

/** Segundos que una lectura del catálogo se sirve desde caché antes de revalidarse. */
export const CATALOG_REVALIDATE_SECONDS = 60;
export const CATALOG_PAGE_SIZE = 12;

export type Loaded<T> = { kind: "ok"; data: T } | { kind: "not-found" } | { kind: "unavailable" };

/** Lee del backend sin lanzar: un backend caído es un resultado más ("no disponible"). */
async function getJson<T>(path: string): Promise<Loaded<T>> {
  let response: Response;
  try {
    response = await backendFetch({ path });
  } catch (error) {
    if (error instanceof BackendUnavailableError) return { kind: "unavailable" };
    throw error;
  }
  if (response.status === 404) return { kind: "not-found" };
  if (!response.ok) return { kind: "unavailable" };
  return { kind: "ok", data: (await response.json()) as T };
}

/*
 * Lecturas públicas cacheadas en el servidor de Next (caché de datos con etiqueta "catalog").
 * Cada petición al backend va firmada con una marca de tiempo distinta, por eso la caché
 * se aplica sobre el resultado (unstable_cache) y no sobre fetch.
 * Si el backend no responde, "no disponible" también se guarda, pero solo hasta la siguiente
 * revalidación (60 s): así el servidor no lo bombardea mientras se recupera.
 */
const cachedWorks = unstable_cache(
  async (query: string, page: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(CATALOG_PAGE_SIZE) });
    if (query) params.set("q", query);
    return getJson<Page<Work>>(`/api/v1/catalog/works?${params}`);
  },
  ["catalog-works"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] },
);

const cachedWork = unstable_cache(
  async (slug: string) => getJson<Work>(`/api/v1/catalog/works/${encodeURIComponent(slug)}`),
  ["catalog-work"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] },
);

const cachedSlugs = unstable_cache(
  async () => getJson<string[]>("/api/v1/catalog/slugs"),
  ["catalog-slugs"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] },
);

export function loadWorks(query: string, page: number): Promise<Loaded<Page<Work>>> {
  return cachedWorks(query.trim().slice(0, 100), Math.max(0, Math.floor(page)));
}

export function loadWork(slug: string): Promise<Loaded<Work>> {
  return cachedWork(slug);
}

/** Slugs para pregenerar fichas en la compilación; sin backend se compila igual (lista vacía). */
export async function loadPublishedSlugs(): Promise<string[]> {
  const result = await cachedSlugs();
  return result.kind === "ok" ? result.data : [];
}
