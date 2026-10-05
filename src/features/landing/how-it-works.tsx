import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { IconTile } from "@/shared/ui/icon-tile";
import { SectionHeading } from "@/shared/ui/section-heading";

import { steps } from "./content";

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona-title" id="como-funciona" className="scroll-mt-24 border-b-[3px] border-line">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading id="como-funciona-title" eyebrow="Paso a paso" title="Cómo funciona" />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number}>
              <Card tone={step.ai ? "ai" : "default"} className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-[var(--radius-chip)] border-2 px-2 py-0.5 font-mono text-sm font-bold",
                      step.ai ? "border-ai text-ai-ink" : "border-line bg-highlight text-on-highlight",
                    )}
                  >
                    {step.number}
                  </span>
                  <IconTile icon={step.icon} tone={step.ai ? "ai" : "default"} />
                </div>
                <h3 className="font-display text-xl font-bold uppercase">{step.title}</h3>
                <p className="text-ink-muted">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
