import { Lock } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";

export const metadata: Metadata = { title: "Sin permiso" };

/** 403: el proxy muestra esta página cuando el rol no alcanza (el backend también lo rechazaría). */
export default function ForbiddenPage() {
  return (
    <div className="halftone flex min-h-[calc(100dvh-72px)] items-center">
      <Container className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-[var(--radius-panel)] border-[3px] border-line bg-highlight text-on-highlight shadow-hard-lg">
          <Lock aria-hidden className="size-9" />
        </span>
        <h1 className="font-display text-4xl font-extrabold uppercase">No tienes permiso para ver esto</h1>
        <p className="max-w-md text-ink-muted">
          Esta sección es solo para curadores del catálogo. Si crees que es un error, pide a un administrador que revise tu rol.
        </p>
        <ButtonLink href={routes.library}>Ir a mi biblioteca</ButtonLink>
      </Container>
    </div>
  );
}
