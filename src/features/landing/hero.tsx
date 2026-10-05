import { ArrowRight, BookOpen, ScanSearch } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";

import { PanelPagePreview } from "./panel-page-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="halftone border-b-[3px] border-line">
      <Container className="grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <Badge className="self-start">
            <ScanSearch aria-hidden className="size-3.5" />
            Lector inteligente de cómics
          </Badge>
          <h1
            id="hero-title"
            className="font-display text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.2rem]"
          >
            Tu biblioteca de cómics,{" "}
            <span className="inline-block -rotate-1 rounded-[var(--radius-chip)] border-[3px] border-line bg-highlight px-2 text-on-highlight shadow-hard">
              viñeta
            </span>{" "}
            por viñeta
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
            Importa tus cómics, léelos en cualquier dispositivo y deja que la IA te guíe viñeta por viñeta.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <ButtonLink href={routes.register} size="lg">
              Crear cuenta gratis
              <ArrowRight aria-hidden className="size-5" />
            </ButtonLink>
            <ButtonLink href={routes.catalog} variant="secondary" size="lg">
              <BookOpen aria-hidden className="size-5" />
              Explorar catálogo
            </ButtonLink>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Compatible con CBZ, PDF e imágenes · Occidental y manga
          </p>
        </div>
        <PanelPagePreview className="mx-auto w-full max-w-md lg:max-w-none" />
      </Container>
    </section>
  );
}
