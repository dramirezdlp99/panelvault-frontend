import type { Metadata } from "next";

import { routes } from "@/shared/config/routes";
import { PublicFooter } from "@/shared/layout/public-footer";
import { PublicHeader } from "@/shared/layout/public-header";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";

export const metadata: Metadata = { title: "Página no encontrada" };

/** 404: una viñeta vacía con un globo de diálogo. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="contenido" className="halftone flex flex-1 items-center">
        <Container className="flex flex-col items-center gap-8 py-20 text-center">
          <div className="relative w-full max-w-sm">
            <div className="aspect-[4/3] rounded-[var(--radius-panel)] border-[3px] border-dashed border-line bg-surface shadow-hard-lg" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[999px] border-[3px] border-line bg-surface px-6 py-3 font-display text-lg font-extrabold uppercase shadow-hard">
              Esta página no existe
            </div>
            <span className="absolute bottom-4 right-4 font-mono text-5xl font-bold text-ink-muted">404</span>
          </div>
          <p className="max-w-md text-ink-muted">
            Puede que el enlace esté mal escrito o que la página se haya movido.
          </p>
          <ButtonLink href={routes.home}>Volver al inicio</ButtonLink>
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}
