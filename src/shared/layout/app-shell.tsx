"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type FormEvent, type ReactNode } from "react";

import { SESSION_EXPIRED_EVENT } from "@/shared/api/http";
import { hasRole, type SessionUser } from "@/shared/auth/roles";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Logo } from "@/shared/ui/logo";

import { appNavItems, isActive } from "./app-nav";
import { OfflineBanner } from "./offline-banner";
import { OnlinePill } from "./online-pill";
import { UserMenu } from "./user-menu";

/**
 * Estructura de las pantallas privadas: barra lateral (escritorio), barra superior con
 * búsqueda y usuario, y navegación inferior en el celular.
 */
export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = appNavItems.filter((item) => !item.minRole || hasRole(user, item.minRole));

  useEffect(() => {
    // Si el servidor dice que la sesión venció, se vuelve al ingreso recordando dónde estaba.
    const onExpired = () => router.replace(`${routes.login}?next=${encodeURIComponent(window.location.pathname)}`);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(q ? `${routes.library}?q=${encodeURIComponent(q)}` : routes.library);
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r-[3px] border-line bg-surface lg:flex">
        <div className="flex h-[72px] items-center border-b-[3px] border-line px-5">
          <Logo href={routes.library} />
        </div>
        <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">Navegación</p>
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-panel)] border-2 px-3 py-2.5 font-display text-lg font-bold",
                  active ? "border-line bg-accent text-on-accent shadow-hard" : "border-transparent hover:border-line",
                )}
              >
                <item.icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b-[3px] border-line bg-paper/95 backdrop-blur">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
            <Logo href={routes.library} className="lg:hidden [&>span:last-child]:hidden sm:[&>span:last-child]:flex" />
            <form role="search" onSubmit={onSearch} className="relative hidden max-w-lg flex-1 md:block">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input
                name="q"
                type="search"
                aria-label="Buscar en tu biblioteca"
                placeholder="Buscar cómics, series…"
                className="h-11 w-full rounded-[var(--radius-panel)] border-2 border-line bg-surface pl-9 pr-3 focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none"
              />
            </form>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <OnlinePill className="hidden sm:inline-flex" />
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
          <OfflineBanner />
        </header>

        <main id="contenido" className="halftone flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Secciones (móvil)"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-[3px] border-line bg-surface lg:hidden"
      >
        {items
          .filter((item) => item.mobile)
          .map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] font-bold uppercase",
                  active ? "bg-accent text-on-accent" : "text-ink",
                )}
              >
                <item.icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
