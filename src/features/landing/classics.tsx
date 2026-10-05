import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

import { ClassicCover } from "./classic-cover";
import { classics } from "./content";

export function Classics() {
  return (
    <section aria-labelledby="clasicos-title" className="border-b-[3px] border-line">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="clasicos-title"
            eyebrow="Archivo abierto"
            title="Clásicos de dominio público"
            description="Obras pioneras de la historieta de prensa, libres de derechos de autor."
          />
          <Link
            href={routes.catalog}
            className="inline-flex items-center gap-2 font-display font-bold uppercase text-accent hover:underline"
          >
            Ver catálogo completo
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {classics.map((classic) => (
            <li key={classic.slug}>
              <Link href={routes.catalogWork(classic.slug)} className="group block h-full rounded-[var(--radius-panel)]">
                <Card interactive className="flex h-full flex-col overflow-hidden">
                  <ClassicCover classic={classic} />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <Badge className="self-start">Dominio público</Badge>
                    <h3 className="font-display text-xl font-bold uppercase group-hover:text-accent">{classic.title}</h3>
                    <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                      {classic.author} · {classic.year}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
