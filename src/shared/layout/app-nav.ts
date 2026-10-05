import { BookMarked, BookOpen, Bookmark, Library, ScanSearch, ShieldCheck, Stamp, type LucideIcon } from "lucide-react";

import type { Role } from "@/shared/auth/roles";
import { routes } from "@/shared/config/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rol mínimo para ver el enlace (el backend igual valida). */
  minRole?: Role;
  /** Aparece en la barra inferior del celular. */
  mobile?: boolean;
};

export const appNavItems: NavItem[] = [
  { href: routes.library, label: "Biblioteca", icon: Library, mobile: true },
  { href: routes.reading, label: "Leyendo", icon: BookOpen, mobile: true },
  { href: routes.bookmarks, label: "Marcadores", icon: Bookmark, mobile: true },
  { href: routes.catalog, label: "Catálogo", icon: BookMarked, mobile: true },
  { href: routes.analysis, label: "Análisis", icon: ScanSearch, mobile: true },
  { href: routes.curation, label: "Curaduría", icon: Stamp, minRole: "CURADOR" },
  { href: routes.security, label: "Seguridad", icon: ShieldCheck },
];

/** Un enlace está activo en su ruta exacta y en sus subrutas. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
