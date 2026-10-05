import { Search } from "lucide-react";

import { routes } from "@/shared/config/routes";

/** Formulario GET: funciona sin JavaScript y la búsqueda queda en la URL (se puede compartir). */
export function CatalogSearch({ query }: { query: string }) {
  return (
    <form action={routes.catalog} method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="catalog-q" className="sr-only">
        Buscar en el catálogo
      </label>
      <div className="relative flex-1">
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
        <input
          id="catalog-q"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={100}
          placeholder="Buscar por título o autor…"
          className="h-12 w-full rounded-[var(--radius-panel)] border-2 border-line bg-surface pl-12 pr-4 focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-[var(--radius-panel)] border-2 border-line bg-accent px-6 font-display font-bold uppercase text-on-accent shadow-hard press"
      >
        Buscar
      </button>
    </form>
  );
}
