import { cn } from "@/shared/lib/cn";

import { Badge } from "./badge";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
  className?: string;
};

/** Encabezado de sección: etiqueta amarilla + título grande, como el rótulo de una viñeta. */
export function SectionHeading({ eyebrow, title, description, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Badge className="self-start">{eyebrow}</Badge>
      <h2 id={id} className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-ink-muted">{description}</p> : null}
    </div>
  );
}
