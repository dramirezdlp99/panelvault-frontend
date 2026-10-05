import { ArrowRight } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";

export function CallToAction() {
  return (
    <section aria-labelledby="cta-title">
      <Container className="py-16 md:py-20">
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] border-[3px] border-line bg-highlight p-8 text-on-highlight shadow-hard-lg md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-56 opacity-30 [background-image:radial-gradient(#16161a_1.5px,transparent_1.5px)] [background-size:12px_12px]"
          />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <h2 id="cta-title" className="font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
                ¿Listo para redescubrir tus cómics?
              </h2>
              <p className="max-w-xl">Crea tu cuenta, importa tu primer cómic y prueba la lectura guiada.</p>
            </div>
            <ButtonLink href={routes.register} size="lg">
              Crear cuenta gratis
              <ArrowRight aria-hidden className="size-5" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
