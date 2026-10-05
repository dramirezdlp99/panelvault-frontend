import type { ReactNode } from "react";

import { Badge } from "./badge";

/** Encabezado de las pantallas privadas: rótulo, título, descripción y acciones a la derecha. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b-2 border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        <Badge className="self-start">{eyebrow}</Badge>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">{title}</h1>
        {description ? <p className="max-w-2xl text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
