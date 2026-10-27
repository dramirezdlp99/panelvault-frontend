"use client";

import { Gauge } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";

import { getInpMonitor, rate } from "./inp";

const tones = {
  good: "border-success text-success",
  "needs-improvement": "border-line bg-highlight text-on-highlight",
  poor: "border-line bg-accent text-on-accent",
};

/** Indicador del INP real de esta sesión; lleva al laboratorio con el detalle. */
export function InpBadge({ className }: { className?: string }) {
  const [inp, setInp] = useState<number | null>(null);

  useEffect(() => getInpMonitor().subscribe((state) => setInp(state.inp)), []);

  const rating = inp === null ? "good" : rate(inp);
  return (
    <Link
      href={routes.lab}
      title="Interaction to Next Paint de esta sesión"
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-chip)] border-2 bg-surface px-2.5 font-mono text-xs font-bold", tones[rating], className)}
    >
      <Gauge aria-hidden className="size-4" />
      INP {inp === null ? "—" : `${Math.round(inp)} ms`}
    </Link>
  );
}
