"use client";

import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/features/auth/api";
import { ROLE_LABELS, type SessionUser } from "@/shared/auth/roles";
import { routes } from "@/shared/config/routes";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Avatar con menú: datos del usuario, seguridad y cerrar sesión. */
export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setLeaving(true);
    await logout().catch(() => null);
    router.replace(routes.home);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-panel)] border-2 border-line bg-surface pl-1.5 pr-2 shadow-hard-sm press"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-line bg-accent font-display text-sm font-bold text-on-accent">
          {initials(user.name) || "?"}
        </span>
        <span className="hidden max-w-32 truncate font-mono text-xs font-bold uppercase sm:inline">{user.name}</span>
        <ChevronDown aria-hidden className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-[var(--radius-panel)] border-2 border-line bg-surface p-2 shadow-hard"
        >
          <div className="border-b-2 border-dashed border-line/20 px-3 pb-3 pt-1">
            <p className="font-bold">{user.name}</p>
            <p className="font-mono text-xs uppercase text-ink-muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <Link
            role="menuitem"
            href={routes.security}
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-[var(--radius-chip)] px-3 py-2 hover:bg-surface-muted"
          >
            <ShieldCheck aria-hidden className="size-4" />
            Seguridad
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            disabled={leaving}
            className="flex w-full items-center gap-2 rounded-[var(--radius-chip)] px-3 py-2 text-left text-accent hover:bg-surface-muted"
          >
            <LogOut aria-hidden className="size-4" />
            {leaving ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
