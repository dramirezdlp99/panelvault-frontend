import type { ReactNode } from "react";

import { Badge } from "@/shared/ui/badge";
import { LogoMark } from "@/shared/ui/logo";

/** Tarjeta centrada de las pantallas de ingreso, con la etiqueta amarilla en la esquina. */
export function AuthCard({ title, subtitle, tag, children }: { title: string; subtitle?: string; tag: string; children: ReactNode }) {
  return (
    <div className="halftone flex min-h-[calc(100dvh-72px)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md rounded-[var(--radius-panel)] border-[3px] border-line bg-surface p-6 shadow-hard-lg sm:p-8">
        <Badge className="absolute -top-3 right-6 shadow-hard-sm">{tag}</Badge>
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-10" />
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">{title}</h1>
          {subtitle ? <p className="text-ink-muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
