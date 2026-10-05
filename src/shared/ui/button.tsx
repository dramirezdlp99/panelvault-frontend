import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-panel)] font-display font-bold uppercase tracking-wide whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "border-2 border-line bg-accent text-on-accent shadow-hard press hover:bg-accent-hover",
  secondary: "border-2 border-line bg-surface text-ink shadow-hard press",
  ghost: "border-2 border-transparent text-ink hover:border-line",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

/** Clases de un botón; se exportan para reutilizarlas en enlaces que lucen como botones. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

/** Un enlace de navegación con aspecto de botón (navegar no es una acción de formulario). */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
