import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";
import { LogoMark } from "@/shared/ui/logo";

export function PublicFooter() {
  return (
    <footer className="border-t-[3px] border-line bg-surface">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <div>
            <p className="font-display text-lg font-extrabold uppercase">{site.name}</p>
            <p className="text-sm text-ink-muted">Proyecto académico de lectura de cómics con visión por computador.</p>
          </div>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-6">
          <Link href={routes.catalog} className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted hover:text-accent">
            Catálogo libre
          </Link>
          <a
            href={site.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted hover:text-accent"
          >
            Código fuente
          </a>
        </nav>
      </Container>
    </footer>
  );
}
