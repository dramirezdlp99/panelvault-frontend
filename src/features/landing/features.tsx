import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { IconTile } from "@/shared/ui/icon-tile";
import { SectionHeading } from "@/shared/ui/section-heading";

import { features } from "./content";

export function Features() {
  return (
    <section aria-labelledby="ventajas-title" className="halftone border-b-[3px] border-line">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading id="ventajas-title" eyebrow="Ventajas" title="Por qué PanelVault" />
        <ul className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title}>
              <Card className="flex h-full flex-col gap-4 p-6">
                <IconTile icon={feature.icon} tone="highlight" />
                <h3 className="font-display text-xl font-bold uppercase">{feature.title}</h3>
                <p className="text-ink-muted">{feature.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
