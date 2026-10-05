import Link from "next/link";

import { cn } from "@/shared/lib/cn";

/** Ícono de la marca: una página de cómic de 2x2 viñetas. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-9", className)}>
      <rect x="1" y="1" width="30" height="30" rx="4" className="fill-surface stroke-line" strokeWidth="2" />
      <rect x="5" y="5" width="10" height="10" rx="1.5" className="fill-accent" />
      <rect x="17" y="5" width="10" height="10" rx="1.5" className="fill-line" />
      <rect x="5" y="17" width="10" height="10" rx="1.5" className="fill-line" />
      <rect x="17" y="17" width="10" height="10" rx="1.5" className="fill-highlight" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="PanelVault, ir al inicio" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold uppercase tracking-tight">PanelVault</span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          Lector de cómics
        </span>
      </span>
    </Link>
  );
}
