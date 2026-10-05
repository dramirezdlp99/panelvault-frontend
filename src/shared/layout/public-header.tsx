"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { Logo } from "@/shared/ui/logo";

export const publicNavLinks = [
  { href: routes.catalog, label: "Catálogo" },
  { href: routes.howItWorks, label: "Cómo funciona" },
] as const;

/** Barra superior de las páginas públicas; en móvil los enlaces se pliegan en un menú. */
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-line bg-paper/95 backdrop-blur">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <ButtonLink href={routes.login} variant="secondary" size="sm">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href={routes.register} size="sm">
            Crear cuenta
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface shadow-hard-sm press"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </Container>

      <div id="menu-movil" hidden={!open} className={cn("border-t-2 border-line bg-surface md:hidden")}>
        <Container className="flex flex-col gap-4 py-5">
          <nav aria-label="Principal móvil" className="flex flex-col gap-3">
            {publicNavLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className="font-display text-lg font-bold uppercase">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink href={routes.login} variant="secondary" size="sm" onClick={close}>
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href={routes.register} size="sm" onClick={close}>
              Crear cuenta
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
